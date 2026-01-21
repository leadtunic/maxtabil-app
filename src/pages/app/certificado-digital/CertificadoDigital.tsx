import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
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
import type { DigitalCert } from "@/types";

type StatusFilter = "ALL" | "EXPIRED" | "EXPIRING_30" | "EXPIRING_60" | "VALID";

export default function CertificadoDigital() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<DigitalCert | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DigitalCert | null>(null);
  const [formData, setFormData] = useState({
    client_name: "",
    cnpj: "",
    cert_type: "A1",
    provider: "",
    expiry_date: "",
    notes: "",
    attachment_url: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["digital_certs"],
    queryFn: async () => {
      const rows = await apiRequest<DigitalCert[]>("/api/digital-certs");
      return rows as DigitalCert[];
    },
  });

  const certs = data ?? [];

  const computeStatus = (cert: DigitalCert) => {
    const now = new Date();
    const expiry = new Date(cert.expiry_date);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "EXPIRED";
    if (diffDays <= 30) return "EXPIRING_30";
    if (diffDays <= 60) return "EXPIRING_60";
    return "VALID";
  };

  const filteredCerts = useMemo(() => {
    return certs.filter((cert) => {
      const status = computeStatus(cert);
      const matchesSearch =
        cert.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (cert.cnpj ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesFrom = !dateFrom || cert.expiry_date >= dateFrom;
      const matchesTo = !dateTo || cert.expiry_date <= dateTo;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [certs, dateFrom, dateTo, search, statusFilter]);

  const summary = useMemo(() => {
    const counts = { expired: 0, expiring30: 0, expiring60: 0 };
    certs.forEach((cert) => {
      const status = computeStatus(cert);
      if (status === "EXPIRED") counts.expired += 1;
      if (status === "EXPIRING_30") counts.expiring30 += 1;
      if (status === "EXPIRING_60") counts.expiring60 += 1;
    });
    return counts;
  }, [certs]);

  const handleOpenCreate = () => {
    setEditingCert(null);
    setFormData({
      client_name: "",
      cnpj: "",
      cert_type: "A1",
      provider: "",
      expiry_date: "",
      notes: "",
      attachment_url: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cert: DigitalCert) => {
    setEditingCert(cert);
    setFormData({
      client_name: cert.client_name,
      cnpj: cert.cnpj ?? "",
      cert_type: cert.cert_type,
      provider: cert.provider ?? "",
      expiry_date: cert.expiry_date,
      notes: cert.notes ?? "",
      attachment_url: cert.attachment_url ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_name || !formData.expiry_date) {
      toast.error("Informe o cliente e a data de vencimento.");
      return;
    }

    try {
      if (editingCert) {
        await apiRequest(`/api/digital-certs/${editingCert.id}`, {
          method: "PUT",
          body: {
            client_name: formData.client_name,
            cnpj: formData.cnpj || null,
            cert_type: formData.cert_type,
            provider: formData.provider || null,
            expiry_date: formData.expiry_date,
            notes: formData.notes || null,
            attachment_url: formData.attachment_url || null,
          },
        });

        await logAudit("DIGITAL_CERT_UPSERT", "digital_certs", editingCert.id, {
          client_name: formData.client_name,
        });
        toast.success("Certificado atualizado.");
      } else {
        const inserted = await apiRequest<DigitalCert>("/api/digital-certs", {
          method: "POST",
          body: {
            client_name: formData.client_name,
            cnpj: formData.cnpj || null,
            cert_type: formData.cert_type,
            provider: formData.provider || null,
            expiry_date: formData.expiry_date,
            notes: formData.notes || null,
            attachment_url: formData.attachment_url || null,
          },
        });

        await logAudit("DIGITAL_CERT_UPSERT", "digital_certs", inserted?.id ?? null, {
          client_name: formData.client_name,
        });
        toast.success("Certificado registrado.");
      }
    } catch (error) {
      toast.error("Não foi possível salvar.", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/api/digital-certs/${deleteTarget.id}`, { method: "DELETE" });
    } catch (error) {
      toast.error("Não foi possível excluir.", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }
    await logAudit("DIGITAL_CERT_DELETED", "digital_certs", deleteTarget.id, {});
    toast.success("Certificado removido.");
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
          <h1 className="text-2xl font-bold text-foreground">Certificado Digital</h1>
          <p className="text-muted-foreground">Controle de vencimentos e renovações.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo certificado
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencidos</CardDescription>
            <CardTitle className="text-2xl">{summary.expired}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarX2 className="w-4 h-4 text-destructive" /> Certificados expirados
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
                  <TableHead>Tipo</TableHead>
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
                ) : filteredCerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum certificado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCerts.map((cert) => {
                    const status = computeStatus(cert);
                    return (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.client_name}</p>
                            {cert.cnpj && <p className="text-sm text-muted-foreground">{cert.cnpj}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{cert.cert_type}</TableCell>
                        <TableCell>{new Date(cert.expiry_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{renderStatusBadge(status)}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(cert)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(cert)}>
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
            <DialogTitle>{editingCert ? "Editar certificado" : "Novo certificado"}</DialogTitle>
            <DialogDescription>Informações para controle de vencimento.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input
                  value={formData.cert_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cert_type: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData((prev) => ({ ...prev, provider: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
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
            <AlertDialogTitle>Excluir certificado?</AlertDialogTitle>
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
