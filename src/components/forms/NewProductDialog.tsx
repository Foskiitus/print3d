"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { Plus } from "lucide-react";

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Atualizámos o estado para refletir a nova base de dados
  const [form, setForm] = useState({
    name: "",
    category: "",
    printTimeMinutes: "",
    recommendedPrice: "",
    stockLevel: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category || null,
          printTimeMinutes: form.printTimeMinutes
            ? Number(form.printTimeMinutes)
            : null,
          recommendedPrice: form.recommendedPrice
            ? Number(form.recommendedPrice)
            : 0,
          stockLevel: form.stockLevel ? Number(form.stockLevel) : 0,
        }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Modelo registado!",
        description: `A receita para "${form.name}" foi criada.`,
      });

      // Limpa o formulário
      setForm({
        name: "",
        category: "",
        printTimeMinutes: "",
        recommendedPrice: "",
        stockLevel: "",
      });
      setOpen(false);
      onCreated(); // Atualiza a tabela no componente pai
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível registar o modelo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          Nova Receita
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar Novo Modelo 3D</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="name">Nome do modelo *</Label>
              <Input
                id="name"
                placeholder="Ex: Vaso Geométrico"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Decoração"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="time">Tempo de Impressão (Minutos)</Label>
            <Input
              id="time"
              type="number"
              min="0"
              placeholder="Ex: 125 (para 2h 05m)"
              value={form.printTimeMinutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, printTimeMinutes: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usado para calcular o desgaste da máquina e custo elétrico.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço Recomendado (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.recommendedPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recommendedPrice: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock Inicial (Unidades)</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={form.stockLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockLevel: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A Guardar..." : "Criar Modelo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
