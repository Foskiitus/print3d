import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  const [products, spools, productionTotals, salesTotals] = await Promise.all([
    prisma.product.findMany({
      where: { userId, alertThreshold: { not: null } },
    }),
    prisma.filamentSpool.findMany({
      where: { userId, alertThreshold: { not: null } },
      include: { filamentType: true },
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
      return { id: p.id, name: p.name, stock, threshold: p.alertThreshold! };
    })
    .filter((p) => p.stock <= p.threshold);

  // Alertas de bobines
  const spoolAlerts = spools
    .filter((s) => s.remaining <= s.alertThreshold!)
    .map((s) => ({
      id: s.id,
      name: `${s.filamentType.brand} ${s.filamentType.colorName}`,
      remaining: s.remaining,
      threshold: s.alertThreshold!,
    }));

  return NextResponse.json({ productAlerts, spoolAlerts });
}
