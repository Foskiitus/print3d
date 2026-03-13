import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'kpi'

  if (type === 'kpi') {
    const now = new Date()
    const monthStart = startOfMonth(now)

    const [allSales, products, monthlySales] = await Promise.all([
      prisma.sale.findMany({ include: { product: true } }),
      prisma.product.findMany(),
      prisma.sale.findMany({ where: { date: { gte: monthStart } }, include: { product: true } }),
    ])

    const totalRevenue = allSales.reduce((sum, s) => sum + s.salePrice * s.quantity, 0)
    const totalCost = allSales.reduce((sum, s) => sum + (s.product.productionCost * s.quantity), 0)
    const totalProfit = totalRevenue - totalCost
    const totalStock = products.reduce((sum, p) => sum + p.stockLevel, 0)
    const monthlySalesVolume = monthlySales.reduce((sum, s) => sum + s.quantity, 0)
    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.salePrice * s.quantity, 0)

    return NextResponse.json({ totalProfit, totalStock, monthlySalesVolume, monthlyRevenue })
  }

  if (type === 'sales-chart') {
    const days = Number(searchParams.get('days') || 30)
    const since = subDays(new Date(), days)
    const sales = await prisma.sale.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    })

    const grouped: Record<string, { revenue: number; count: number }> = {}
    for (let i = days; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      grouped[d] = { revenue: 0, count: 0 }
    }
    for (const sale of sales) {
      const d = format(new Date(sale.date), 'yyyy-MM-dd')
      if (grouped[d]) {
        grouped[d].revenue += sale.salePrice * sale.quantity
        grouped[d].count += sale.quantity
      }
    }

    return NextResponse.json(
      Object.entries(grouped).map(([date, v]) => ({ date, ...v }))
    )
  }

  if (type === 'top-products') {
    const sales = await prisma.sale.findMany({ include: { product: true } })
    const map: Record<number, { name: string; totalSold: number; revenue: number }> = {}
    for (const sale of sales) {
      if (!map[sale.productId]) map[sale.productId] = { name: sale.product.name, totalSold: 0, revenue: 0 }
      map[sale.productId].totalSold += sale.quantity
      map[sale.productId].revenue += sale.salePrice * sale.quantity
    }
    const sorted = Object.values(map).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5)
    return NextResponse.json(sorted)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
