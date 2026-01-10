import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CalendarX2, CalendarClock, CalendarCheck, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { LegalDoc, LegalDocType } from "@/types";

const docTypeLabels: Record<LegalDocType, string> = {
  CND: "CND",
  BOMBEIRO_AVCB: "AVCB (Bombeiro)",
  SANITARIA: "Licença Sanitária",
  ALVARA: "Alvará",
};

type StatusFilter = "ALL" | "EXPIRED" | "EXPIRING_30" | "EXPIRING_60" | "VALID";

export default function Legalizacao() {
  const [search, setSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<LegalDocType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegalDoc | null>(null);
  const [formData, setFormData] = useState({
    client_name: "",
    cnpj: "",
    doc_type: "CND" as LegalDocType,
    issue_date: "",
    expiry_date: "",
    notes: "",
    attachment_url: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["legal_docs"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("legal_docs")
        .select("*")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return rows as LegalDoc[];
    },
  });

  const docs = data ?? [];

  const computeStatus = (doc: LegalDoc) => {
    const now = new Date();
    const expiry = new Date(doc.expiry_date);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "EXPIRED";
    if (diffDays <= 30) return "EXPIRING_30";
    if (diffDays <= 60) return "EXPIRING_60";
    return "VALID";
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const status = computeStatus(doc);
      const matchesSearch =
        doc.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (doc.cnpj ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesType = docTypeFilter === "ALL" || doc.doc_type === docTypeFilter;
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesFrom = !dateFrom || doc.expiry_date >= dateFrom;
      const matchesTo = !dateTo || doc.expiry_date <= dateTo;
      return matchesSearch && matchesType && matchesStatus && matchesFrom && matchesTo;
    });
  }, [dateFrom, dateTo, docTypeFilter, docs, search, statusFilter]);

  const summary = useMemo(() => {
    const counts = { expired: 0, expiring30: 0, expiring60: 0 };
    docs.forEach((doc) => {
      const status = computeStatus(doc);
      if (status === "EXPIRED") counts.expired += 1;
      if (status === "EXPIRING_30") counts.expiring30 += 1;
      if (status === "EXPIRING_60") counts.expiring60 += 1;
    });
    return counts;
  }, [docs]);

  const handleOpenCreate = () => {
    setEditingDoc(null);
    setFormData({
      client_name: "",
      cnpj: "",
      doc_type: "CND",
      issue_date: "",
      expiry_date: "",
      notes: "",
      attachment_url: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (doc: LegalDoc) => {
    setEditingDoc(doc);
    setFormData({
      client_name: doc.client_name,
      cnpj: doc.cnpj ?? "",
      doc_type: doc.doc_type,
      issue_date: doc.issue_date ?? "",
      expiry_date: doc.expiry_date,
      notes: doc.notes ?? "",
      attachment_url: doc.attachment_url ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_name || !formData.expiry_date) {
      toast.error("Informe o cliente e a data de vencimento.");
      return;
    }

    if (editingDoc) {
      const { error } = await supabase
        .from("legal_docs")
        .update({
          client_name: formData.client_name,
          cnpj: formData.cnpj || null,
          doc_type: formData.doc_type,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date,
          notes: formData.notes || null,
          attachment_url: formData.attachment_url || null,
        })
        .eq("id", editingDoc.id);

      if (error) {
        toast.error("Não foi possível atualizar.");
        return;
      }

      await logAudit("LEGAL_DOC_UPSERT", "legal_docs", editingDoc.id, {
        client_name: formData.client_name,
      });
      toast.success("Documento atualizado.");
    } else {
      const { data: inserted, error } = await supabase
        .from("legal_docs")
        .insert({
          client_name: formData.client_name,
          cnpj: formData.cnpj || null,
          doc_type: formData.doc_type,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date,
          notes: formData.notes || null,
          attachment_url: formData.attachment_url || null,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Não foi possível criar.");
        return;
      }

      await logAudit("LEGAL_DOC_UPSERT", "legal_docs", inserted?.id ?? null, {
        client_name: formData.client_name,
      });
      toast.success("Documento registrado.");
    }

    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("legal_docs").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    await logAudit("LEGAL_DOC_DELETED", "legal_docs", deleteTarget.id, {});
    toast.success("Documento removido.");
    setDeleteTarget(null);
    refetch();
  };

  const renderStatusBadge = (status: StatusFilter) => {
    if (status === "EXPIRED") return <Badge className="bg-destructive/10 text-destructive">Vencido</Badge>;
    if (status === "EXPIRING_30") return <Badge className="bg-amber-100 text-amber-700">Vence em 30d</Badge>;
    if (status === "EXPIRING_60") return <Badge className="bg-yellow-100 text-yellow-700">Vence em 60d</Badge>;
    return <Badge variant="secondary">Válido</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Legalização</h1>
          <p className="text-muted-foreground">Controle de documentos e vencimentos.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo documento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencidos</CardDescription>
            <CardTitle className="text-2xl">{summary.expired}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarX2 className="w-4 h-4 text-destructive" /> Documentos expirados
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vence em 30 dias</CardDescription>
            <CardTitle className="text-2xl">{summary.expiring30}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="w-4 h-4 text-amber-600" /> Prioridade alta
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vence em 60 dias</CardDescription>
            <CardTitle className="text-2xl">{summary.expiring60}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheck className="w-4 h-4 text-emerald-600" /> Monitoramento
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <Input
                placeholder="Buscar por cliente ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={docTypeFilter} onValueChange={(value) => setDocTypeFilter(value as LegalDocType | "ALL")}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  {Object.entries(docTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="EXPIRED">Vencido</SelectItem>
                  <SelectItem value="EXPIRING_30">Vence em 30d</SelectItem>
                  <SelectItem value="EXPIRING_60">Vence em 60d</SelectItem>
                  <SelectItem value="VALID">Válido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label>De</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label>Até</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => {
                    const status = computeStatus(doc);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.client_name}</p>
                            {doc.cnpj && <p className="text-sm text-muted-foreground">{doc.cnpj}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{docTypeLabels[doc.doc_type]}</TableCell>
                        <TableCell>{new Date(doc.expiry_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{renderStatusBadge(status)}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(doc)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(doc)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Editar documento" : "Novo documento"}</DialogTitle>
            <DialogDescription>Controle de validade e observações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData((prev) => ({ ...prev, cnpj: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.doc_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, doc_type: value as LegalDocType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(docTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emissão</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Anexo (URL)</Label>
              <Input
                value={formData.attachment_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, attachment_url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
