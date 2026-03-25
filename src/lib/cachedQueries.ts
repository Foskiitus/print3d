import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Cache de 30 segundos para o stock de produtos
export const getCachedProductStock = unstable_cache(
  async (userId: string) => {
    // --- DADOS DUMMY PARA PRODUCTION LOG ---
    const dummyProductionTotals = [
      { productId: "p1", _sum: { quantity: 100 } },
      { productId: "p2", _sum: { quantity: 50 } },
    ];

    const [salesTotals] = await Promise.all([
      prisma.sale.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
    ]);

    return { productionTotals: dummyProductionTotals, salesTotals };
  },
  ["product-stock"],
  { revalidate: 30, tags: ["stock"] },
);

// Cache de 60 segundos para alertas
export const getCachedAlerts = unstable_cache(
  async (userId: string) => {
    const DEFAULT_SPOOL_THRESHOLD = 500;

    // --- DADOS DUMMY PARA FILAMENT TYPES ---
    const dummyFilamentTypes = [
      {
        id: "f1",
        brand: "Generic",
        colorName: "Preto",
        colorHex: "#000000",
        alertThreshold: 300,
        spools: [{ remaining: 150 }, { remaining: 50 }],
      },
      {
        id: "f2",
        brand: "Premium",
        colorName: "Branco",
        colorHex: "#ffffff",
        alertThreshold: 500,
        spools: [{ remaining: 800 }],
      },
    ];

    // --- DADOS DUMMY PARA PRODUCTION LOG ---
    const dummyProductionTotals = [{ productId: "p1", _sum: { quantity: 10 } }];

    const [products, salesTotals] = await Promise.all([
      prisma.product.findMany({
        where: { userId, alertThreshold: { not: null } },
      }),
      prisma.sale.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
    ]);

    // Lógica de Alertas de Produtos
    const productAlerts = products
      .map((p) => {
        const produced =
          dummyProductionTotals.find((t) => t.productId === p.id)?._sum
            .quantity ?? 0;
        const sold =
          salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
        const stock = produced - sold;

        if (stock > (p.alertThreshold ?? 0)) return null;

        const severity = stock === 0 ? "critical" : ("warning" as const);
        return {
          id: p.id,
          name: p.name,
          stock,
          threshold: p.alertThreshold ?? 0,
          severity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Lógica de Alertas de Spools (usando dummyFilamentTypes)
    const spoolAlerts = dummyFilamentTypes
      .map((ft) => {
        if (ft.spools.length === 0) return null;
        const totalRemaining = ft.spools.reduce((s, sp) => s + sp.remaining, 0);
        const threshold = ft.alertThreshold ?? DEFAULT_SPOOL_THRESHOLD;

        if (totalRemaining > threshold) return null;

        const severity =
          totalRemaining < 100 ? "critical" : ("warning" as const);
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

    return { productAlerts, spoolAlerts };
  },
  ["alerts"],
  { revalidate: 60, tags: ["alerts", "stock"] },
);
