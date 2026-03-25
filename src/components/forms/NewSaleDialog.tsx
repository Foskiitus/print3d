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
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { toast } from "@/components/ui/toaster";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { ShoppingCart, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";

export function NewSaleDialog({
  products,
  onCreated,
  locale,
}: {
  products: any[];
  onCreated: () => void;
  locale?: string;
}) {
  const c = useIntlayer("dialogs");
  const d = c.sale;

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

  useEffect(() => {
    if (!open) return;
    fetch("/api/customers", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, [open]);

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

  function stockColor(stock: number) {
    if (stock <= 0) return "text-destructive";
    if (stock <= 3) return "text-warning";
    return "text-muted-foreground";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !salePrice || !quantity) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
          salePrice: Number(salePrice),
          customerId: customerId || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || d.errorDefault.value);
      const customerName = customers.find((cu) => cu.id === customerId)?.name;
      toast({
        title: d.successTitle.value,
        description: `${quantity}× ${selectedProduct?.name}${customerName ? ` — ${customerName}` : ""} — ${formatCurrency(Number(salePrice) * Number(quantity))}`,
      });
      reset();
      setOpen(false);
      refreshAlerts();
      onCreated();
    } catch (error: any) {
      toast({
        title: c.common.error.value,
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
          {d.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>{d.product}</Label>
            <SearchableSelect
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.stock} un.)`,
                render: (
                  <div className="flex items-center justify-between w-full gap-3">
                    <span>{p.name}</span>
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        stockColor(p.stock),
                      )}
                    >
                      {p.stock} un.
                    </span>
                  </div>
                ),
                disabled: p.stock <= 0,
              }))}
              value={productId}
              onValueChange={(id) => {
                setProductId(id);
                setQuantity("");
              }}
              placeholder={d.productPlaceholder.value}
              searchPlaceholder={d.productSearch.value}
            />
            {selectedProduct && (
              <p className={cn("text-[10px]", stockColor(availableStock))}>
                {availableStock <= 0
                  ? d.noStock
                  : `${availableStock} ${d.unitsAvailable}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{d.quantity}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableStock || undefined}
                placeholder={d.quantityPlaceholder.value}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={quantityExceedsStock ? "border-destructive" : ""}
                required
              />
              {quantityExceedsStock && (
                <p className="text-[10px] text-destructive">
                  {d.exceedsStock} ({availableStock} un.)
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salePrice">{d.unitPrice}</Label>
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

          {total !== null && (
            <div className="p-3 rounded-lg bg-muted/40 text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{d.totalSale}</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              {profit !== null && (
                <div className="flex justify-between items-center border-t border-border pt-2">
                  <span className="text-muted-foreground">
                    {d.estimatedProfit}
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      profit >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {profit >= 0 ? "+" : ""}
                    {formatCurrency(profit)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              {d.customer}{" "}
              <span className="text-muted-foreground font-normal">
                ({c.common.optional})
              </span>
            </Label>
            <SearchableSelect
              options={customers.map((cu) => ({
                value: cu.id,
                label: cu.email ? `${cu.name} (${cu.email})` : cu.name,
                render: (
                  <div className="flex flex-col">
                    <span>{cu.name}</span>
                    {cu.email && (
                      <span className="text-[10px] text-muted-foreground">
                        {cu.email}
                      </span>
                    )}
                  </div>
                ),
              }))}
              value={customerId}
              onValueChange={setCustomerId}
              placeholder={d.customerPlaceholder.value}
              searchPlaceholder={d.customerSearch.value}
              emptyText={d.customerEmpty.value}
            />
            <a
              href={locale ? `/${locale}/customers` : "/customers"}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors w-fit"
            >
              <UserPlus size={11} />
              {d.manageCustomers}
            </a>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              {d.notes}{" "}
              <span className="text-muted-foreground font-normal">
                ({c.common.optional})
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder={d.notesPlaceholder.value}
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
              {c.common.cancel}
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
              {loading ? d.submitting : d.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
