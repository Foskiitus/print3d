import { prisma } from "@/lib/prisma";
import { PrintersClient } from "./PrintersClient";

export const metadata = {
  title: "Gestão de Impressoras | Print3D",
  description: "Configure os custos operacionais e consumo das suas máquinas.",
};

export default async function PrintersPage() {
  // Procuramos todas as impressoras registadas no sistema
  const printers = await prisma.printer.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Impressoras 3D
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie o seu parque de máquinas para garantir cálculos de custo
          energético e manutenção precisos.
        </p>
      </div>

      <div className="border-t border-muted pt-6">
        {/* Passamos as impressoras para o componente Client que lida com a interatividade */}
        <PrintersClient initialPrinters={printers} />
      </div>

      {/* Dica de Utilização para o utilizador */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mt-8">
        <h4 className="text-sm font-semibold text-primary mb-1">
          Como funcionam os custos?
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          O <strong>Custo Horário</strong> deve incluir a amortização da máquina
          e manutenção preventiva. O <strong>Consumo (W)</strong> é usado para
          calcular o gasto elétrico com base no tempo de impressão de cada
          produto no seu inventário.
        </p>
      </div>
    </div>
  );
}
