import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Cache de 30 segundos para o stock de produtos
// Invalida automaticamente com revalidateTag("stock")
export const getCachedProductStock = unstable_cache(
  async (userId: string) => {
    const [productionTotals, salesTotals] = await Promise.all([
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

    return { productionTotals, salesTotals };
  },
  ["product-stock"],
  { revalidate: 30, tags: ["stock"] },
);

// Cache de 60 segundos para alertas
export const getCachedAlerts = unstable_cache(
  async (userId: string) => {
    const DEFAULT_SPOOL_THRESHOLD = 500;

    const [products, filamentTypes, productionTotals, salesTotals] =
      await Promise.all([
        prisma.product.findMany({
          where: { userId, alertThreshold: { not: null } },
        }),
        prisma.filamentType.findMany({
          where: { userId },
          include: {
            spools: { where: { userId }, select: { remaining: true } },
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

    const productAlerts = products
      .map((p) => {
        const produced =
          productionTotals.find((t) => t.productId === p.id)?._sum.quantity ??
          0;
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

    const spoolAlerts = filamentTypes
      .map((ft) => {
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

    return { productAlerts, spoolAlerts };
  },
  ["alerts"],
  { revalidate: 60, tags: ["alerts", "stock"] },
);
