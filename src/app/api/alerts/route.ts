import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_SPOOL_THRESHOLD = 500; // gramas

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // --- DADOS DUMMY PARA TABELAS REMOVIDAS ---
  const dummyProductionTotals = [
    { productId: "p1", _sum: { quantity: 100 } },
    { productId: "p2", _sum: { quantity: 50 } },
  ];

  const dummyFilamentTypes = [
    {
      id: "f1",
      brand: "Generic",
      colorName: "Preto",
      colorHex: "#000000",
      alertThreshold: 300,
      spools: [{ remaining: 150 }, { remaining: 50 }],
    },
  ];

  // Mantemos apenas as consultas das tabelas que ainda existem (Product e Sale)
  const [products, salesTotals] = await Promise.all([
    // Produtos com threshold definido
    prisma.product.findMany({
      where: { userId, alertThreshold: { not: null } },
    }),
    // Vendas agrupadas por produto
    prisma.sale.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
  ]);

  // Alertas de produtos (usando dummyProductionTotals)
  const productAlerts = products
    .map((p) => {
      const produced =
        dummyProductionTotals.find((t) => t.productId === p.id)?._sum
          .quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;

      const stock = produced - sold;

      // Se não há produção ou o stock está acima do limite, não alerta
      if (produced === 0 || stock > (p.alertThreshold ?? 0)) return null;

      const severity = stock === 0 ? "critical" : ("warning" as const);

      return {
        id: p.id,
        name: p.name,
        stock,
        threshold: p.alertThreshold!,
        severity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Alertas de filamentos (usando dummyFilamentTypes)
  const spoolAlerts = dummyFilamentTypes
    .map((ft) => {
      if (ft.spools.length === 0) return null;

      const totalRemaining = ft.spools.reduce((s, sp) => s + sp.remaining, 0);
      const threshold = ft.alertThreshold ?? DEFAULT_SPOOL_THRESHOLD;

      if (totalRemaining > threshold) return null;

      const severity = totalRemaining < 100 ? "critical" : ("warning" as const);

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

  return NextResponse.json({
    productAlerts,
    spoolAlerts,
  });
}
