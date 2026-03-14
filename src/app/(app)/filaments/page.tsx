import { prisma } from "@/lib/prisma";
import { FilamentsClient } from "./FilamentsClient";

export default async function FilamentsPage() {
  const [types, spools] = await Promise.all([
    prisma.filamentType.findMany({
      include: {
        _count: { select: { spools: true } },
      },
      orderBy: { brand: "asc" },
    }),
    prisma.filamentSpool.findMany({
      include: { filamentType: true },
      orderBy: { purchaseDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Gestão de Materiais
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controle os tipos de filamento e o stock físico de bobines.
        </p>
      </div>

      <FilamentsClient
        initialTypes={types as any}
        initialSpools={spools as any}
      />
    </div>
  );
}
