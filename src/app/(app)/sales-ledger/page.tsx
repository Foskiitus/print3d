import { prisma } from '@/lib/prisma'
import { SalesClient } from './SalesClient'

export default async function SalesLedgerPage() {
  const sales = await prisma.sale.findMany({
    include: { product: true },
    orderBy: { date: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Vendas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registre vendas e consulte o histórico de transações
        </p>
      </div>
      <SalesClient
        initialSales={sales.map(s => ({
          ...s,
          date: s.date.toISOString(),
          product: {
            ...s.product,
            createdAt: s.product.createdAt.toISOString(),
            updatedAt: s.product.updatedAt.toISOString(),
          },
        }))}
      />
    </div>
  )
}
