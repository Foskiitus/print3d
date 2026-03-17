import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FilamentsClient } from "./FilamentsClient";

export const metadata = { title: "Filamentos" };

export default async function FilamentsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [types, spools] = await Promise.all([
    prisma.filamentType.findMany({
      where: { userId },
      include: { _count: { select: { spools: true } } },
      orderBy: { brand: "asc" },
    }),
    prisma.filamentSpool.findMany({
      where: { userId },
      include: {
        filamentType: true,
        _count: { select: { adjustments: true } },
      },
      orderBy: { purchaseDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Filamentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controla os tipos de material e o stock físico de bobines.
        </p>
      </div>
      <FilamentsClient
        initialTypes={types as any}
        initialSpools={spools as any}
      />
    </div>
  );
}
