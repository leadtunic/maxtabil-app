import { LinksSection } from "@/components/links/LinksSection";

export default function CertificadoDigitalWorkspace() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Certificado Digital</h1>
        <p className="text-muted-foreground">Workspace do setor de certificados digitais.</p>
      </div>
      <LinksSection sector="CERTIFICADO_DIGITAL" />
    </div>
  );
}
