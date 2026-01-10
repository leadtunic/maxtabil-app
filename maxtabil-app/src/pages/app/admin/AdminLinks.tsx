import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link2, Plus, Search, MoreHorizontal, ExternalLink, GripVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { LinkItem, LinkSector } from "@/types";

const categories = ["Sistemas", "Portais", "Documentos", "Ferramentas", "Outros"];
const sectors: Array<{ value: LinkSector; label: string }> = [
  { value: "GERAL", label: "Geral" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "DP", label: "Departamento Pessoal" },
  { value: "FISCAL_CONTABIL", label: "Fiscal/Contábil" },
  { value: "LEGALIZACAO", label: "Legalização" },
  { value: "CERTIFICADO_DIGITAL", label: "Certificado Digital" },
  { value: "ADMIN", label: "Administração" },
];

export default function AdminLinks() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "Sistemas",
    sector: "GERAL" as LinkSector,
    is_active: true,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["app_links"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("app_links")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return rows as LinkItem[];
    },
  });

  const links = data ?? [];

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        link.title.toLowerCase().includes(search.toLowerCase()) ||
        link.url.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || link.category === categoryFilter;
      const matchesSector = sectorFilter === "ALL" || link.sector === sectorFilter;
      return matchesSearch && matchesCategory && matchesSector;
    });
  }, [categoryFilter, links, search, sectorFilter]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLink(null);
    setFormData({ title: "", url: "", category: "Sistemas", sector: "GERAL", is_active: true });
  };

  const handleSaveLink = async () => {
    if (!formData.title || !formData.url) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingLink) {
      const { error } = await supabase
        .from("app_links")
        .update({
          title: formData.title,
          url: formData.url,
          category: formData.category,
          sector: formData.sector,
          is_active: formData.is_active,
        })
        .eq("id", editingLink.id);

      if (error) {
        toast.error("Não foi possível atualizar o link.");
        return;
      }

      await logAudit("LINK_UPDATED", "app_links", editingLink.id, {
        title: formData.title,
      });
      toast.success("Link atualizado");
    } else {
      const nextOrder = links.length ? Math.max(...links.map((l) => l.sort_order)) + 1 : 1;
      const { data: inserted, error } = await supabase
        .from("app_links")
        .insert({
          title: formData.title,
          url: formData.url,
          category: formData.category,
          sector: formData.sector,
          is_active: formData.is_active,
          sort_order: nextOrder,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Não foi possível adicionar o link.");
        return;
      }

      await logAudit("LINK_CREATED", "app_links", inserted?.id ?? null, {
        title: formData.title,
      });
      toast.success("Link adicionado");
    }

    handleCloseDialog();
    refetch();
  };

  const handleEditLink = (link: LinkItem) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      sector: link.sector,
      is_active: link.is_active,
    });
    setIsDialogOpen(true);
  };

  const toggleLinkStatus = async (link: LinkItem) => {
    const { error } = await supabase
      .from("app_links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);

    if (error) {
      toast.error("Não foi possível atualizar o status.");
      return;
    }

    await logAudit("LINK_UPDATED", "app_links", link.id, {
      is_active: !link.is_active,
    });
    toast.success("Status atualizado");
    refetch();
  };

  const deleteLink = async (link: LinkItem) => {
    const { error } = await supabase.from("app_links").delete().eq("id", link.id);
    if (error) {
      toast.error("Não foi possível remover o link.");
      return;
    }
    await logAudit("LINK_UPDATED", "app_links", link.id, { deleted: true });
    toast.success("Link removido");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Links Úteis</h1>
          <p className="text-muted-foreground">Gerencie os links da intranet</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Link
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Editar Link" : "Novo Link"}</DialogTitle>
            <DialogDescription>
              {editingLink ? "Atualize as informações do link" : "Adicione um novo link à intranet"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Nome do link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Select
                value={formData.sector}
                onValueChange={(value: LinkSector) =>
                  setFormData((prev) => ({ ...prev, sector: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Link Ativo</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLink}>{editingLink ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos setores</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum link encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLinks.map((link) => (
                    <motion.tr
                      key={link.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Link2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{link.title}</p>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                            >
                              {link.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{link.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {sectors.find((sector) => sector.value === link.sector)?.label ??
                            link.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={link.is_active ? "default" : "secondary"}
                          className={link.is_active ? "bg-success/10 text-success" : ""}
                        >
                          {link.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLink(link)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleLinkStatus(link)}>
                              {link.is_active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteLink(link)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
