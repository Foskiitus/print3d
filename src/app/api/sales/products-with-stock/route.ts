import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sales/products-with-stock
// Devolve produtos com stock calculado dinamicamente — usado pelo SalesClient após mutações
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  const [products, productionTotals, salesTotals, productionCosts] =
    await Promise.all([
      prisma.product.findMany({
        where: { userId },
        orderBy: { name: "asc" },
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
      prisma.productionLog.groupBy({
        by: ["productId"],
        where: { userId },
        _avg: { totalCost: true },
      }),
    ]);

  const productsWithStock = products.map((p) => {
    const produced =
      productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
    const sold =
      salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
    const avgCost =
      productionCosts.find((t) => t.productId === p.id)?._avg.totalCost ?? null;
    const costPerUnit =
      avgCost !== null ? avgCost / (p.unitsPerPrint ?? 1) : null;

    return {
      ...p,
      stock: produced - sold,
      costPerUnit,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(productsWithStock);
}
