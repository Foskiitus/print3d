import { prisma } from "@/lib/prisma";
import { startOfMonth, subDays, format } from "date-fns";
import { TrendingUp, Package, ShoppingCart, DollarSign } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesLineChart } from "@/components/charts/SalesLineChart";
import { TopProductsChart } from "@/components/charts/TopProductsChart";
import { formatCurrency } from "@/lib/utils";

async function getDashboardData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const since30 = subDays(now, 30);

  // 1. Adicionamos a busca ao ProductionLog para ter os custos reais
  const [allSales, products, monthlySales, recentSales, allProductionLogs] =
    await Promise.all([
      prisma.sale.findMany({ include: { product: true } }),
      prisma.product.findMany(),
      prisma.sale.findMany({ where: { date: { gte: monthStart } } }),
      prisma.sale.findMany({
        where: { date: { gte: since30 } },
        orderBy: { date: "asc" },
      }),
      prisma.productionLog.findMany(), // <--- Onde estão os verdadeiros gastos
    ]);

  // 2. O total faturado continua a vir das vendas
  const totalRevenue = allSales.reduce(
    (s, x) => s + x.salePrice * x.quantity,
    0,
  );

  // 3. O custo total agora é a soma de TUDO o que gastaste nas impressões (Cash Flow Real)
  const totalRealCost = allProductionLogs.reduce(
    (s, log) => s + (log.totalCost || 0),
    0,
  );

  // 4. Lucro = Faturação - Gastos Reais de Produção
  const totalProfit = totalRevenue - totalRealCost;

  const totalStock = products.reduce((s, p) => s + p.stockLevel, 0);
  const monthlySalesVolume = monthlySales.reduce((s, x) => s + x.quantity, 0);
  const monthlyRevenue = monthlySales.reduce(
    (s, x) => s + x.salePrice * x.quantity,
    0,
  );

  // Chart data: Faturação diária (últimos 30 dias)
  const grouped: Record<string, { revenue: number; count: number }> = {};
  for (let i = 29; i >= 0; i--) {
    grouped[format(subDays(now, i), "yyyy-MM-dd")] = { revenue: 0, count: 0 };
  }
  for (const sale of recentSales) {
    const d = format(new Date(sale.date), "yyyy-MM-dd");
    if (grouped[d]) {
      grouped[d].revenue += sale.salePrice * sale.quantity;
      grouped[d].count += sale.quantity;
    }
  }
  const chartData = Object.entries(grouped).map(([date, v]) => ({
    date,
    ...v,
  }));

  // Top products
  const map: Record<
    number,
    { name: string; totalSold: number; revenue: number }
  > = {};
  for (const sale of allSales) {
    if (!map[sale.productId])
      map[sale.productId] = {
        name: sale.product.name,
        totalSold: 0,
        revenue: 0,
      };
    map[sale.productId].totalSold += sale.quantity;
    map[sale.productId].revenue += sale.salePrice * sale.quantity;
  }
  const topProducts = Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Mudei para ordenar por faturação em vez de quantidade

  return {
    totalProfit,
    totalStock,
    monthlySalesVolume,
    monthlyRevenue,
    chartData,
    topProducts,
  };
}

export default async function DashboardPage() {
  const {
    totalProfit,
    totalStock,
    monthlySalesVolume,
    monthlyRevenue,
    chartData,
    topProducts,
  } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão geral financeira e logística da produção 3D
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usamos a tua função utilitária formatCurrency para ter o valor em Euros ou Reais certinho */}
        <KpiCard
          title="Lucro Líquido Real"
          value={formatCurrency(totalProfit)}
          sub="Faturação - Custos Fabrico"
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="Peças em Stock"
          value={String(totalStock)}
          sub="Prontas a vender"
          icon={Package}
          trend="neutral"
        />
        <KpiCard
          title="Vendas (Mês)"
          value={String(monthlySalesVolume)}
          sub="Unidades faturadas"
          icon={ShoppingCart}
          trend="up"
        />
        <KpiCard
          title="Faturação (Mês)"
          value={formatCurrency(monthlyRevenue)}
          sub="Entrada bruta"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Faturação — Últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Peças Mais Rentáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={topProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
