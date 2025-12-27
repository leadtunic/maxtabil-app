import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const testLinks = [
  { label: "Link de teste - Legalização", url: "https://example.com" },
];

export default function Legalizacao() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Legalização</h1>
        <p className="text-muted-foreground">Área em construção com links de teste.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links de Teste</CardTitle>
          <CardDescription>Conteúdo provisório para navegação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {testLinks.map((link) => (
            <div
              key={link.label}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
            >
              <span className="text-sm font-medium">{link.label}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted/50"
              >
                Demonstrativo
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
