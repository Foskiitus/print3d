import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_SPOOL_THRESHOLD = 500; // gramas

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  const [products, filamentTypes, productionTotals, salesTotals] =
    await Promise.all([
      // Produtos com threshold definido
      prisma.product.findMany({
        where: { userId, alertThreshold: { not: null } },
      }),
      // Tipos de filamento com as suas bobines
      prisma.filamentType.findMany({
        where: { userId },
        include: {
          spools: {
            where: { userId },
            select: { remaining: true },
          },
        },
      }),
      prisma.productionLog.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
      prisma.sale.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
    ]);

  // Alertas de produtos
  const productAlerts = products
    .map((p) => {
      const produced =
        productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const stock = produced - sold;
      if (stock > p.alertThreshold!) return null;
      const severity = stock === 0 ? "critical" : "warning";
      return {
        id: p.id,
        name: p.name,
        stock,
        threshold: p.alertThreshold!,
        severity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Alertas de filamentos — soma todas as bobines do tipo
  const spoolAlerts = filamentTypes
    .map((ft) => {
      // Ignorar tipos sem nenhuma bobine registada
      if (ft.spools.length === 0) return null;
      const totalRemaining = ft.spools.reduce((s, sp) => s + sp.remaining, 0);
      const threshold = ft.alertThreshold ?? DEFAULT_SPOOL_THRESHOLD;
      if (totalRemaining > threshold) return null;
      const severity = totalRemaining < 100 ? "critical" : "warning";
      return {
        id: ft.id,
        name: `${ft.brand} ${ft.colorName}`,
        colorHex: ft.colorHex,
        remaining: totalRemaining,
        threshold,
        spoolCount: ft.spools.length,
        severity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ productAlerts, spoolAlerts });
}
