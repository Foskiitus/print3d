import { prisma } from '@/lib/prisma'
import { startOfMonth, subDays, format } from 'date-fns'
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesLineChart } from '@/components/charts/SalesLineChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { formatCurrency } from '@/lib/utils'

async function getDashboardData() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const since30 = subDays(now, 30)

  const [allSales, products, monthlySales, recentSales] = await Promise.all([
    prisma.sale.findMany({ include: { product: true } }),
    prisma.product.findMany(),
    prisma.sale.findMany({ where: { date: { gte: monthStart } }, include: { product: true } }),
    prisma.sale.findMany({ where: { date: { gte: since30 } }, orderBy: { date: 'asc' } }),
  ])

  const totalRevenue = allSales.reduce((s, x) => s + x.salePrice * x.quantity, 0)
  const totalCost = allSales.reduce((s, x) => s + x.product.productionCost * x.quantity, 0)
  const totalProfit = totalRevenue - totalCost
  const totalStock = products.reduce((s, p) => s + p.stockLevel, 0)
  const monthlySalesVolume = monthlySales.reduce((s, x) => s + x.quantity, 0)
  const monthlyRevenue = monthlySales.reduce((s, x) => s + x.salePrice * x.quantity, 0)

  // Chart data
  const grouped: Record<string, { revenue: number; count: number }> = {}
  for (let i = 29; i >= 0; i--) {
    grouped[format(subDays(now, i), 'yyyy-MM-dd')] = { revenue: 0, count: 0 }
  }
  for (const sale of recentSales) {
    const d = format(new Date(sale.date), 'yyyy-MM-dd')
    if (grouped[d]) { grouped[d].revenue += sale.salePrice * sale.quantity; grouped[d].count += sale.quantity }
  }
  const chartData = Object.entries(grouped).map(([date, v]) => ({ date, ...v }))

  // Top products
  const map: Record<number, { name: string; totalSold: number; revenue: number }> = {}
  for (const sale of allSales) {
    if (!map[sale.productId]) map[sale.productId] = { name: sale.product.name, totalSold: 0, revenue: 0 }
    map[sale.productId].totalSold += sale.quantity
    map[sale.productId].revenue += sale.salePrice * sale.quantity
  }
  const topProducts = Object.values(map).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5)

  return { totalProfit, totalStock, monthlySalesVolume, monthlyRevenue, chartData, topProducts }
}

export default async function DashboardPage() {
  const { totalProfit, totalStock, monthlySalesVolume, monthlyRevenue, chartData, topProducts } = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu negócio de impressão 3D</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Lucro total" value={formatCurrency(totalProfit)} sub="Todas as vendas" icon={DollarSign} trend="up" />
        <KpiCard title="Itens em estoque" value={String(totalStock)} sub="Unidades disponíveis" icon={Package} trend="neutral" />
        <KpiCard title="Vendas (mês)" value={String(monthlySalesVolume)} sub="Unidades vendidas" icon={ShoppingCart} trend="up" />
        <KpiCard title="Receita (mês)" value={formatCurrency(monthlyRevenue)} sub="Mês atual" icon={TrendingUp} trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Evolução de vendas — 30 dias</CardTitle></CardHeader>
          <CardContent><SalesLineChart data={chartData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top 5 modelos mais vendidos</CardTitle></CardHeader>
          <CardContent><TopProductsChart data={topProducts} /></CardContent>
        </Card>
      </div>
    </div>
  )
}
