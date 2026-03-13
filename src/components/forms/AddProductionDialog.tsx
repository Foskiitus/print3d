'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toaster'
import { Factory } from 'lucide-react'
import type { Product } from '@/types'

export function AddProductionDialog({ products, onAdded }: { products: Product[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !quantity) return
    setLoading(true)
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: Number(productId), quantity: Number(quantity), notes }),
      })
      if (!res.ok) throw new Error()
      const product = products.find(p => p.id === Number(productId))
      toast({ title: 'Produção registrada!', description: `+${quantity} unidades de "${product?.name}".` })
      setProductId(''); setQuantity(''); setNotes('')
      setOpen(false)
      onAdded()
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível registrar a produção.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Factory size={14} className="mr-1.5" />Adicionar produção</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar produção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Modelo *</Label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger><SelectValue placeholder="Selecione o modelo..." /></SelectTrigger>
              <SelectContent>
                {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantidade produzida *</Label>
            <Input id="qty" type="number" min="1" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" placeholder="Ex: Lote março/2026" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !productId || !quantity}>{loading ? 'Salvando...' : 'Registrar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
