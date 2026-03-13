'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Plus } from 'lucide-react'

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', productionCost: '', recommendedPrice: '', stockLevel: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          productionCost: Number(form.productionCost),
          recommendedPrice: Number(form.recommendedPrice),
          stockLevel: Number(form.stockLevel),
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Produto criado!', description: `"${form.name}" adicionado ao estoque.` })
      setForm({ name: '', productionCost: '', recommendedPrice: '', stockLevel: '' })
      setOpen(false)
      onCreated()
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível criar o produto.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus size={14} className="mr-1.5" />Novo item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar novo modelo 3D</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do modelo *</Label>
            <Input id="name" placeholder="Ex: Suporte ergonômico" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost">Custo de produção (R$)</Label>
              <Input id="cost" type="number" step="0.01" min="0" placeholder="0.00" value={form.productionCost} onChange={e => setForm(f => ({ ...f, productionCost: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço recomendado (R$)</Label>
              <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" value={form.recommendedPrice} onChange={e => setForm(f => ({ ...f, recommendedPrice: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Estoque inicial</Label>
            <Input id="stock" type="number" min="0" placeholder="0" value={form.stockLevel} onChange={e => setForm(f => ({ ...f, stockLevel: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar produto'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
