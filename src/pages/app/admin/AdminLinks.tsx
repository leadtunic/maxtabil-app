import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link2, Plus, Search, MoreHorizontal, ExternalLink, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { LinkItem } from "@/types";

const categories = ["Sistemas", "Portais", "Documentos", "Ferramentas", "Outros"];

const mockLinks: LinkItem[] = [
  { id: "lnk_1", title: "E-CAC", url: "https://cav.receita.fazenda.gov.br", category: "Portais", order: 1, isActive: true },
  { id: "lnk_2", title: "SPED", url: "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/sped-sistema-publico-de-escrituracao-digital", category: "Sistemas", order: 2, isActive: true },
  { id: "lnk_3", title: "eSocial", url: "https://login.esocial.gov.br", category: "Sistemas", order: 3, isActive: true },
  { id: "lnk_4", title: "Conectividade Social", url: "https://conectividadesocialv2.caixa.gov.br", category: "Sistemas", order: 4, isActive: false },
  { id: "lnk_5", title: "Simples Nacional", url: "http://www8.receita.fazenda.gov.br/SimplesNacional", category: "Portais", order: 5, isActive: true },
];

export default function AdminLinks() {
  const [links, setLinks] = useState<LinkItem[]>(mockLinks);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "Sistemas",
    isActive: true,
  });

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      link.url.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || link.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveLink = () => {
    if (!formData.title || !formData.url) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingLink) {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === editingLink.id
            ? { ...l, ...formData }
            : l
        )
      );
      toast.success("Link atualizado");
    } else {
      const newLink: LinkItem = {
        id: `lnk_${Date.now()}`,
        ...formData,
        order: links.length + 1,
      };
      setLinks((prev) => [...prev, newLink]);
      toast.success("Link adicionado");
    }

    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLink(null);
    setFormData({ title: "", url: "", category: "Sistemas", isActive: true });
  };

  const handleEditLink = (link: LinkItem) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      isActive: link.isActive,
    });
    setIsDialogOpen(true);
  };

  const toggleLinkStatus = (linkId: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId ? { ...l, isActive: !l.isActive } : l
      )
    );
    toast.success("Status atualizado");
  };

  const deleteLink = (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    toast.success("Link removido");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Links Úteis</h1>
          <p className="text-muted-foreground">Gerencie os links da intranet</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Link
            </Button>
          </DialogTrigger>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Link Ativo</Label>
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSaveLink}>
                {editingLink ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
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
                              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {link.url.slice(0, 40)}...
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{link.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={link.isActive ? "default" : "secondary"}
                          className={
                            link.isActive
                              ? "bg-success/10 text-success hover:bg-success/20"
                              : ""
                          }
                        >
                          {link.isActive ? "Ativo" : "Inativo"}
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
                            <DropdownMenuItem onClick={() => toggleLinkStatus(link.id)}>
                              {link.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteLink(link.id)}
                              className="text-destructive"
                            >
                              Excluir
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
