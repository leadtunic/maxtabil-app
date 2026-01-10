import { FileText, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimuladorRescisao from "./SimuladorRescisao";
import SimuladorFerias from "./SimuladorFerias";

interface DepartamentoPessoalProps {
  defaultTab?: "rescisao" | "ferias";
}

export default function DepartamentoPessoal({ defaultTab = "rescisao" }: DepartamentoPessoalProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Departamento Pessoal</h1>
        <p className="text-muted-foreground">
          Simuladores de rescisão e férias em um único painel.
        </p>
      </div>
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="rescisao" className="gap-2">
            <FileText className="h-4 w-4" />
            Rescisão
          </TabsTrigger>
          <TabsTrigger value="ferias" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Férias
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rescisao">
          <SimuladorRescisao />
        </TabsContent>
        <TabsContent value="ferias">
          <SimuladorFerias />
        </TabsContent>
      </Tabs>

    </div>
  );
}
