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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { Plus, Weight } from "lucide-react";

export function AddSpoolDialog({
  types,
  onAdded,
}: {
  types: any[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    filamentTypeId: "",
    spoolWeight: "1000",
    price: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.filamentTypeId || !form.price) return;

    setLoading(true);
    try {
      const res = await fetch("/api/filaments/spools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filamentTypeId: Number(form.filamentTypeId),
          spoolWeight: Number(form.spoolWeight),
          remaining: Number(form.spoolWeight), // Começa cheia
          price: Number(form.price),
          purchaseDate: new Date(form.purchaseDate).toISOString(),
        }),
      });
      if (!res.ok) throw new Error();

      toast({ title: "Bobine registada no inventário!" });
      setForm({
        filamentTypeId: "",
        spoolWeight: "1000",
        price: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
      onAdded();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível registar a bobine.",
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
          Entrada de Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar Nova Bobine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Tipo de Material</Label>
            <Select
              value={form.filamentTypeId}
              onValueChange={(v) => setForm({ ...form, filamentTypeId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o material..." />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.brand} {t.material} ({t.colorName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Peso Líquido (g)</Label>
              <Input
                id="weight"
                type="number"
                value={form.spoolWeight}
                onChange={(e) =>
                  setForm({ ...form, spoolWeight: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço de Compra (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Data de Compra</Label>
            <Input
              id="date"
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm({ ...form, purchaseDate: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A registar..." : "Adicionar ao Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
