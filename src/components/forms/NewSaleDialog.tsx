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
import {
  ShoppingCart,
  UserPlus,
  ClipboardList,
  Package,
  Info,
  Loader2,
} from "lucide-react";
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
  const [opLoading, setOpLoading] = useState(false);

  // Step: "form" | "op_suggestion"
  const [step, setStep] = useState<"form" | "op_suggestion">("form");
  const [opSuggestion, setOpSuggestion] = useState<{
    shortage: number;
    suggestedOpQty: number;
    batchSize: number;
  } | null>(null);

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
      headers: { "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "" },
    })
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, [open]);

  const total =
    salePrice && quantity && Number(quantity) > 0
      ? Number(salePrice) * Number(quantity)
      : null;

  // exceedsStock só é aviso visual — não bloqueia (o utilizador pode encomendar sem stock)
  const quantityExceedsStock =
    quantity !== "" && Number(quantity) > availableStock;

  const productionCost = selectedProduct?.costPerUnit ?? null;
  const profit =
    total !== null && productionCost !== null
      ? total - productionCost * Number(quantity)
      : null;

  const reset = () => {
    setStep("form");
    setOpSuggestion(null);
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

  // ── Shared fetch helper ────────────────────────────────────────────────────
  async function postSale(generateOp: boolean, forceCreate = false) {
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
        generateOp,
        forceCreate,
      }),
    });
    return { res, data: await res.json() };
  }

  function successToast(data: any) {
    const customerName = customers.find((cu) => cu.id === customerId)?.name;
    toast({
      title: d.successTitle.value,
      description: `${quantity}× ${selectedProduct?.name}${customerName ? ` — ${customerName}` : ""} — ${formatCurrency(Number(salePrice) * Number(quantity))}`,
    });
  }

  // ── Step 1: submit form → check stock ─────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !salePrice || !quantity) return;
    setLoading(true);
    try {
      const { res, data } = await postSale(false);

      // Stock insuficiente → mostrar sugestão de OP
      if (res.status === 409 && data.stockInsufficient) {
        setOpSuggestion({
          shortage: data.shortage,
          suggestedOpQty: data.suggestedOpQty,
          batchSize: data.batchSize,
        });
        setStep("op_suggestion");
        return;
      }

      if (!res.ok) throw new Error(data.error || d.errorDefault.value);

      successToast(data);
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

  // ── Step 2a: criar venda + OP urgente ─────────────────────────────────────
  async function handleCreateWithOp() {
    setOpLoading(true);
    try {
      const { res, data } = await postSale(true);
      if (!res.ok) throw new Error(data.error || d.errorDefault.value);
      toast({
        title: "✓ Venda registada + OP urgente criada",
        description: `OP ${data.productionOrder?.reference} — ${opSuggestion?.suggestedOpQty} un. agendadas.`,
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
      setOpLoading(false);
    }
  }

  // ── Step 2b: criar venda sem OP (aguarda produção manual) ─────────────────
  async function handleCreateWithoutOp() {
    setOpLoading(true);
    try {
      const { res, data } = await postSale(false, true);
      if (!res.ok) throw new Error(data.error || d.errorDefault.value);
      toast({ title: "Venda registada — aguarda produção" });
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
      setOpLoading(false);
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
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* ── Step 2: sugestão de OP ── */}
          {step === "op_suggestion" && opSuggestion && selectedProduct && (
            <div className="space-y-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-2.5">
                <ClipboardList
                  size={15}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Gerar Ordem de Produção?
                  </p>
                  <p className="text-xs text-amber-700">
                    Stock insuficiente para{" "}
                    <span className="font-semibold">
                      {selectedProduct.name}
                    </span>
                    . Tens{" "}
                    <span className="font-semibold">
                      {Math.max(0, availableStock)}
                    </span>{" "}
                    un., faltam{" "}
                    <span className="font-semibold">
                      {opSuggestion.shortage}
                    </span>{" "}
                    un.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-background/60 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tamanho da placa
                  </span>
                  <span className="font-medium">
                    {opSuggestion.batchSize} un.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OP sugerida</span>
                  <span className="font-medium">
                    {opSuggestion.suggestedOpQty} un.
                  </span>
                </div>
                {opSuggestion.suggestedOpQty > opSuggestion.shortage && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">
                      <Package size={10} />
                      Sobra para stock
                    </span>
                    <span className="font-medium">
                      {opSuggestion.suggestedOpQty - opSuggestion.shortage} un.
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 flex items-start gap-1">
                  <Info size={9} className="flex-shrink-0 mt-0.5" />A OP ficará
                  marcada como{" "}
                  <span className="font-medium mx-0.5">Urgente</span> e ligada a
                  esta encomenda. Ao concluir, as {opSuggestion.shortage} un.
                  são entregues automaticamente ao cliente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCreateWithoutOp}
                  disabled={opLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
                >
                  Registar sem OP
                </button>
                <button
                  type="button"
                  onClick={handleCreateWithOp}
                  disabled={opLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {opLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ClipboardList size={12} />
                  )}
                  Criar OP Urgente
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar ao formulário
              </button>
            </div>
          )}

          {/* ── Step 1: formulário ── */}
          <div className={step === "op_suggestion" ? "hidden" : "contents"}>
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
                  // Não desabilitar — utilizador pode encomendar mesmo sem stock (gera OP)
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
                  placeholder={d.quantityPlaceholder.value}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={quantityExceedsStock ? "border-warning" : ""}
                  required
                />
                {quantityExceedsStock && (
                  <p className="text-[10px] text-warning">
                    Excede o stock — será gerada uma OP.
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
                disabled={loading || !productId || !salePrice || !quantity}
              >
                {loading && (
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                )}
                {loading ? d.submitting : d.submit}
              </Button>
            </div>
          </div>
          {/* end step 1 */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
