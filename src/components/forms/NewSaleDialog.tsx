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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function NewSaleDialog({
  products,
  onCreated,
}: {
  products: any[]; // inclui campo stock
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(""); // ✅ vazio por defeito
  const [salePrice, setSalePrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const availableStock = selectedProduct?.stock ?? 0;

  const handleProductChange = (id: string) => {
    setProductId(id);
    setQuantity(""); // ✅ limpar quantidade ao mudar produto
  };

  const total =
    salePrice && quantity && Number(quantity) > 0
      ? Number(salePrice) * Number(quantity)
      : null;

  const quantityExceedsStock =
    quantity !== "" && Number(quantity) > availableStock;

  const reset = () => {
    setProductId("");
    setQuantity("");
    setSalePrice("");
    setCustomerName("");
    setNotes("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !salePrice || !quantity) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
          salePrice: Number(salePrice),
          customerName: customerName.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registar venda");

      toast({
        title: "Venda registada!",
        description: `${quantity}× ${selectedProduct?.name} — ${formatCurrency(Number(salePrice) * Number(quantity))}`,
      });

      reset();
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <ShoppingCart size={14} className="mr-1.5" />
          Nova Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Produto com stock */}
          <div className="space-y-1.5">
            <Label>Produto</Label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>{p.name}</span>
                      <span
                        className={`text-xs font-medium ${
                          p.stock <= 0
                            ? "text-destructive"
                            : p.stock <= 3
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        ({p.stock} un.)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Stock info abaixo do select */}
            {selectedProduct && (
              <p
                className={`text-[10px] ${
                  availableStock <= 0
                    ? "text-destructive"
                    : availableStock <= 3
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                }`}
              >
                {availableStock <= 0
                  ? "Sem stock disponível"
                  : `${availableStock} unidade(s) disponível(eis)`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantidade */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableStock || undefined}
                placeholder="ex: 1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={quantityExceedsStock ? "border-destructive" : ""}
                required
              />
              {quantityExceedsStock && (
                <p className="text-[10px] text-destructive">
                  Excede o stock disponível ({availableStock} un.)
                </p>
              )}
            </div>

            {/* Preço por unidade */}
            <div className="space-y-1.5">
              <Label htmlFor="salePrice">Preço por unidade (€)</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Total preview */}
          {total !== null && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 text-sm">
              <span className="text-muted-foreground">Total da venda</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
          )}

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="customer">
              Cliente{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              id="customer"
              placeholder="Nome do cliente..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Notas{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Observações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

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
              disabled={
                loading ||
                !productId ||
                !salePrice ||
                !quantity ||
                quantityExceedsStock ||
                availableStock <= 0
              }
            >
              {loading ? "A registar..." : "Registar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
