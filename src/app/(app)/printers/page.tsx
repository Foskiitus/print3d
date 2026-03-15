import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintersClient } from "./PrintersClient";

export const metadata = {
  title: "Gestão de Impressoras | Print3D",
  description: "Configure os custos operacionais e consumo das suas máquinas.",
};

export default async function PrintersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "admin";

  const [printers, presets] = await Promise.all([
    prisma.printer.findMany({
      where: { userId: session.user.id },
      include: { preset: true },
      orderBy: { name: "asc" },
    }),
    prisma.printerPreset.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

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
        <PrintersClient
          initialPrinters={printers as any}
          presets={presets as any}
          isAdmin={isAdmin}
        />
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
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
