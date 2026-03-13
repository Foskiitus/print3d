'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NewProductDialog } from '@/components/forms/NewProductDialog'
import { AddProductionDialog } from '@/components/forms/AddProductionDialog'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

export function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)

  const refresh = useCallback(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
  }, [])

  function stockBadge(level: number) {
    if (level === 0) return <Badge variant="destructive">Sem estoque</Badge>
    if (level <= 2) return <Badge variant="warning">Baixo ({level})</Badge>
    return <Badge variant="success">{level} un.</Badge>
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-sm text-muted-foreground">{products.length} modelos cadastrados</p>
        <div className="flex gap-2">
          <AddProductionDialog products={products} onAdded={refresh} />
          <NewProductDialog onCreated={refresh} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Modelo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Custo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Preço rec.</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Margem</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const margin = p.recommendedPrice > 0
                    ? ((p.recommendedPrice - p.productionCost) / p.recommendedPrice * 100).toFixed(0)
                    : '—'
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.productionCost)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(p.recommendedPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={Number(margin) >= 50 ? 'text-emerald-400' : Number(margin) >= 30 ? 'text-amber-400' : 'text-red-400'}>
                          {margin !== '—' ? `${margin}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{stockBadge(p.stockLevel)}</td>
                    </tr>
                  )
                })}
                {products.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum modelo cadastrado. Crie o primeiro!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
