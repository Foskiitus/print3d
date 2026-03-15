import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpoolDetailClient } from "./SpoolDetailClient";

export default async function SpoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

  const spool = await prisma.filamentSpool.findUnique({
    where: { id },
    include: {
      filamentType: true,
      adjustments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Não encontrada ou pertence a outro utilizador
  if (!spool || spool.userId !== userId) notFound();

  // Produções que usaram este tipo de filamento
  // (ligação via filamentType — o ProductionLog regista o custo total,
  //  mas o consumo por tipo está em ProductFilamentUsage)
  const productionUsage = await prisma.productionLog.findMany({
    where: {
      userId,
      product: {
        filamentUsage: {
          some: { filamentTypeId: spool.filamentTypeId },
        },
      },
    },
    include: {
      product: {
        include: {
          filamentUsage: {
            where: { filamentTypeId: spool.filamentTypeId },
          },
        },
      },
      printer: true,
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center gap-3">
        <Link
          href="/filaments"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {spool.filamentType.brand} — {spool.filamentType.colorName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {spool.filamentType.material} · Detalhe da bobine
          </p>
        </div>
      </div>

      <SpoolDetailClient
        spool={spool as any}
        productionUsage={productionUsage as any}
      />
    </div>
  );
}
