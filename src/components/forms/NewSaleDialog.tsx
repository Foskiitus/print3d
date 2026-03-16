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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { ShoppingCart, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function NewSaleDialog({
  products,
  onCreated,
}: {
  products: any[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const availableStock = selectedProduct?.stock ?? 0;

  // Carregar clientes quando o dialog abre
  useEffect(() => {
    if (!open) return;
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, [open]);

  const handleProductChange = (id: string) => {
    setProductId(id);
    setQuantity("");
  };

  const total =
    salePrice && quantity && Number(quantity) > 0
      ? Number(salePrice) * Number(quantity)
      : null;

  const quantityExceedsStock =
    quantity !== "" && Number(quantity) > availableStock;

  const productionCost = selectedProduct?.costPerUnit ?? null;
  const profit =
    total !== null && productionCost !== null
      ? total - productionCost * Number(quantity)
      : null;

  const reset = () => {
    setProductId("");
    setQuantity("");
    setSalePrice("");
    setCustomerId("");
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
          customerId: customerId || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registar venda");

      const customerName = customers.find((c) => c.id === customerId)?.name;
      toast({
        title: "Venda registada!",
        description: `${quantity}× ${selectedProduct?.name}${customerName ? ` — ${customerName}` : ""} — ${formatCurrency(Number(salePrice) * Number(quantity))}`,
      });

      reset();
      setOpen(false);
      refreshAlerts();
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
          {/* Produto */}
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
                  Excede o stock ({availableStock} un.)
                </p>
              )}
            </div>
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
            <div className="p-3 rounded-lg bg-muted/40 text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total da venda</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              {profit !== null && (
                <div className="flex justify-between items-center border-t border-border pt-2">
                  <span className="text-muted-foreground">Lucro estimado</span>
                  <span
                    className={`font-bold ${profit >= 0 ? "text-emerald-400" : "text-destructive"}`}
                  >
                    {profit >= 0 ? "+" : ""}
                    {formatCurrency(profit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cliente do sistema */}
          <div className="space-y-1.5">
            <Label>
              Cliente{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {customers.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhum cliente registado
                  </div>
                ) : (
                  customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        {c.email && (
                          <span className="text-[10px] text-muted-foreground">
                            {c.email}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
                {/* Link para criar novo cliente */}
                <div className="px-2 py-1.5 border-t border-border mt-1">
                  <a
                    href="/customers"
                    target="_blank"
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors py-1"
                  >
                    <UserPlus size={12} />
                    Gerir clientes
                  </a>
                </div>
              </SelectContent>
            </Select>
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
