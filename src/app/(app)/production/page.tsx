import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { ProductionClient } from './ProductionClient'

export default async function ProductionPage() {
  const [logs, products] = await Promise.all([
    prisma.productionLog.findMany({ include: { product: true }, orderBy: { date: 'desc' }, take: 50 }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Produção</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Registre lotes produzidos e acompanhe o histórico</p>
      </div>
      <ProductionClient
        initialLogs={logs.map(l => ({ ...l, date: l.date.toISOString(), product: { ...l.product, createdAt: l.product.createdAt.toISOString(), updatedAt: l.product.updatedAt.toISOString() } }))}
        products={products.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }))}
      />
    </div>
  )
}
