"use client";

import { useState, useEffect } from "react";
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
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types";

export function NewSaleDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    productId: "",
    customerName: "",
    quantity: "1",
    salePrice: "",
  });

  useEffect(() => {
    if (open)
      fetch("/api/products")
        .then((r) => r.json())
        .then(setProducts);
  }, [open]);

  const selectedProduct = products.find((p) => p.id === Number(form.productId));

  useEffect(() => {
    if (selectedProduct)
      setForm((f) => ({
        ...f,
        salePrice: String(
          selectedProduct.calculatedCosts?.suggestedPrice ?? "",
        ),
      }));
  }, [selectedProduct]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(form.productId),
          customerName: form.customerName,
          quantity: Number(form.quantity),
          salePrice: Number(form.salePrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: "Venda registrada!",
        description: `${form.quantity}x "${selectedProduct?.name}" para ${form.customerName}.`,
      });
      setForm({
        productId: "",
        customerName: "",
        quantity: "1",
        salePrice: "",
      });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast({
        title: "Erro",
        description:
          err instanceof Error ? err.message : "Falha ao registrar venda.",
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
          <ShoppingCart size={14} className="mr-1.5" />
          Nova venda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Produto *</Label>
            <Select
              value={form.productId}
              onValueChange={(v) => setForm((f) => ({ ...f, productId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => (p.stockLevel ?? 0) > 0)
                  .map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}{" "}
                      <span className="text-muted-foreground">
                        (estoque: {p.stockLevel ?? 0})
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer">Cliente *</Label>
            <Input
              id="customer"
              placeholder="Nome do cliente"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Quantidade *</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                max={selectedProduct?.stockLevel ?? undefined}
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço de venda (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, salePrice: e.target.value }))
                }
                required
              />
            </div>
          </div>
          {selectedProduct && (
            <p className="text-xs text-muted-foreground">
              Custo unitário: R${" "}
              {(selectedProduct.calculatedCosts?.total ?? 0).toFixed(2)} ·
              Margem: €{" "}
              {(
                Number(form.salePrice) -
                (selectedProduct.calculatedCosts?.total ?? 0)
              ).toFixed(2)}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.productId || !form.customerName}
            >
              {loading ? "Salvando..." : "Registrar venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
