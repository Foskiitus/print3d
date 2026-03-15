import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FilamentsClient } from "./FilamentsClient";

export default async function FilamentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

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
        _count: { select: { adjustments: true } }, // ✅ necessário para controlar botão apagar
      },
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
