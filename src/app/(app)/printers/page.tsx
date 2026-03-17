import { requirePageAuth, getAuthUserIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintersClient } from "./PrintersClient";

export const metadata = {
  title: "Impressoras",
  description: "Configure os custos operacionais e consumo das suas máquinas.",
};

export default async function PrintersPage() {
  const userId = await requirePageAuth();
  const isAdmin = await getAuthUserIsAdmin();

  const [printers, presets] = await Promise.all([
    prisma.printer.findMany({
      where: { userId },
      include: { preset: true },
      orderBy: { name: "asc" },
    }),
    prisma.printerPreset.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Impressoras</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gere o parque de máquinas para cálculos de custo energético precisos.
        </p>
      </div>

      <PrintersClient
        initialPrinters={printers as any}
        presets={presets as any}
        isAdmin={isAdmin}
      />

      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-primary mb-1">
          Como funcionam os custos?
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          O <strong>Custo Horário</strong> deve incluir a amortização da máquina
          e manutenção preventiva. O <strong>Consumo (W)</strong> é usado para
          calcular o gasto elétrico com base no tempo de impressão.
        </p>
      </div>
    </div>
  );
}
