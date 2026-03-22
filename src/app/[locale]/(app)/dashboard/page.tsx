import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("dashboard", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 30);

  const [
    sales,
    productions,
    products,
    spools,
    productionCosts,
    salesTotals,
    productionTotals,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { userId, date: { gte: since } },
      include: { product: true, customer: true },
      orderBy: { date: "asc" },
    }),
    prisma.productionLog.findMany({
      where: { userId, date: { gte: since } },
      include: { product: true },
      orderBy: { date: "asc" },
    }),
    prisma.product.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.filamentSpool.findMany({
      where: { userId },
      include: { filamentType: true },
    }),
    prisma.productionLog.groupBy({
      by: ["productId"],
      where: { userId },
      _avg: { totalCost: true },
    }),
    prisma.sale.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
    prisma.productionLog.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true, filamentUsed: true },
    }),
  ]);

  // ── Calcular métricas ─────────────────────────────────────────────────────
  const costMap = Object.fromEntries(
    productionCosts.map((p) => [
      p.productId,
      (p._avg.totalCost ?? 0) /
        (products.find((pr) => pr.id === p.productId)?.unitsPerPrint ?? 1),
    ]),
  );

  const revenue = sales.reduce((s, x) => s + x.salePrice * x.quantity, 0);
  const profit = sales.reduce((s, x) => {
    const cost = costMap[x.productId] ?? 0;
    return s + (x.salePrice - cost) * x.quantity;
  }, 0);

  const unitsProduced = productions.reduce((s, p) => s + p.quantity, 0);
  const filamentConsumed = productions.reduce(
    (s, p) => s + (p.filamentUsed ?? 0),
    0,
  );

  const stockMap = Object.fromEntries(
    products.map((p) => {
      const produced =
        productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      return [p.id, { name: p.name, stock: produced - sold }];
    }),
  );

  const topProducts = [...salesTotals]
    .sort((a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0))
    .slice(0, 5)
    .map((t) => ({
      name: products.find((p) => p.id === t.productId)?.name ?? "—",
      quantity: t._sum.quantity ?? 0,
    }));

  const revenueByDay: Record<string, number> = {};
  const productionByDay: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    revenueByDay[key] = 0;
    productionByDay[key] = 0;
  }

  for (const sale of sales) {
    const key = new Date(sale.date).toISOString().split("T")[0];
    if (key in revenueByDay)
      revenueByDay[key] += sale.salePrice * sale.quantity;
  }

  for (const prod of productions) {
    const key = new Date(prod.date).toISOString().split("T")[0];
    if (key in productionByDay) productionByDay[key] += prod.quantity;
  }

  const dailyRevenue = Object.entries(revenueByDay).map(([date, value]) => ({
    date,
    value: Math.round(value * 100) / 100,
  }));
  const dailyProduction = Object.entries(productionByDay).map(
    ([date, value]) => ({ date, value }),
  );

  const filamentStock = Object.values(
    spools.reduce((acc: any, spool) => {
      const key = spool.filamentTypeId;
      if (!acc[key]) {
        acc[key] = {
          name: `${spool.filamentType.brand} ${spool.filamentType.colorName}`,
          colorHex: spool.filamentType.colorHex,
          remaining: 0,
          total: 0,
        };
      }
      acc[key].remaining += spool.remaining;
      acc[key].total += spool.spoolWeight;
      return acc;
    }, {}),
  )
    .sort((a: any, b: any) => a.remaining - b.remaining)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{c.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{c.subtitle}</p>
      </div>
      <DashboardClient
        metrics={{ revenue, profit, unitsProduced, filamentConsumed }}
        dailyRevenue={dailyRevenue}
        dailyProduction={dailyProduction}
        topProducts={topProducts}
        stockMap={Object.values(stockMap) as any}
        filamentStock={filamentStock as any}
      />
    </div>
  );
}
