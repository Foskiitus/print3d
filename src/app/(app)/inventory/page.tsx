import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { InventoryClient } from './InventoryClient'

export default async function InventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Estoque</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus modelos 3D e acompanhe o estoque</p>
      </div>
      <InventoryClient initialProducts={products.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }))} />
    </div>
  )
}
