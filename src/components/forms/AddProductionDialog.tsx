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
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { toast } from "@/components/ui/toaster";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { Factory, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";

export function AddProductionDialog({
  products,
  printers,
  onAdded,
}: {
  products: any[];
  printers: any[];
  onAdded: () => void;
}) {
  const c = useIntlayer("dialogs");
  const d = c.production;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [printHours, setPrintHours] = useState("");
  const [printMinutes, setPrintMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const quantity = selectedProduct?.unitsPerPrint ?? 1;

  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      const totalMinutes = product.productionTime ?? 0;
      setPrintHours(
        totalMinutes > 0 ? String(Math.floor(totalMinutes / 60)) : "",
      );
      setPrintMinutes(totalMinutes > 0 ? String(totalMinutes % 60) : "");
      if (product.printerId) setPrinterId(product.printerId);
    }
  };

  const reset = () => {
    setProductId("");
    setPrinterId("");
    setPrintHours("");
    setPrintMinutes("");
    setNotes("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !printerId) return;
    const printTime =
      (parseInt(printHours || "0", 10) || 0) * 60 +
      (parseInt(printMinutes || "0", 10) || 0);
    setLoading(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          productId,
          printerId,
          quantity,
          printTime: printTime > 0 ? printTime : null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || d.errorDefault.value);
      toast({
        title: d.successTitle.value,
        description: `+${quantity} × "${selectedProduct?.name}". ${c.common.total.value}: ${formatCurrency(data.totalCost || 0)}`,
      });
      reset();
      setOpen(false);
      refreshAlerts();
      onAdded();
    } catch (error: any) {
      toast({
        title: d.errorTitle.value,
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
          <Factory size={14} className="mr-1.5" />
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
                label:
                  p.unitsPerPrint > 1
                    ? `${p.name} (×${p.unitsPerPrint}/${d.unitsPerPrint.value})`
                    : p.name,
              }))}
              value={productId}
              onValueChange={handleProductChange}
              placeholder={d.productPlaceholder.value}
              searchPlaceholder={d.productSearch.value}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{d.printer}</Label>
            {selectedProduct?.printerId ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                <span className="font-medium">
                  {printers.find((p) => p.id === selectedProduct.printerId)
                    ?.name ?? "—"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {d.printerSetOnProduct}
                </span>
              </div>
            ) : (
              <SearchableSelect
                options={printers.map((p) => ({ value: p.id, label: p.name }))}
                value={printerId}
                onValueChange={setPrinterId}
                placeholder={d.printerPlaceholder.value}
                searchPlaceholder={d.printerSearch.value}
                emptyText={d.printerEmpty.value}
              />
            )}
          </div>

          {selectedProduct &&
            (() => {
              const totalFilament =
                selectedProduct.filamentUsage?.reduce(
                  (s: number, fu: any) => s + fu.weight,
                  0,
                ) ?? 0;
              return (
                <div className="p-3 rounded-lg bg-muted/40 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {d.unitsProduced}
                    </span>
                    <span className="font-bold text-success">+{quantity}</span>
                  </div>
                  {totalFilament > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {d.estimatedFilament}
                      </span>
                      <span className="font-medium">{totalFilament}g</span>
                    </div>
                  )}
                  {selectedProduct.filamentUsage?.length > 1 && (
                    <div className="pt-1 border-t border-border space-y-0.5">
                      {selectedProduct.filamentUsage.map((fu: any) => (
                        <div
                          key={fu.filamentTypeId}
                          className="flex justify-between text-[10px] text-muted-foreground"
                        >
                          <span className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: fu.filamentType?.colorHex,
                              }}
                            />
                            {fu.filamentType?.brand}{" "}
                            {fu.filamentType?.colorName}
                          </span>
                          <span>{fu.weight}g</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedProduct.unitsPerPrint > 1 && (
                    <p className="text-[10px] text-muted-foreground pt-0.5">
                      {d.autoCalculated} ({selectedProduct.unitsPerPrint}{" "}
                      {d.unitsPerPrintLabel.value})
                    </p>
                  )}
                </div>
              );
            })()}

          <div className="space-y-1.5">
            <Label>{d.printTime}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={printHours}
                  onChange={(e) => setPrintHours(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {c.common.hours}
                </span>
              </div>
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={printMinutes}
                  onChange={(e) => setPrintMinutes(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {c.common.minutes}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {d.printTimeSub}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>
              {d.notes}{" "}
              <span className="text-muted-foreground font-normal">
                ({c.common.optional})
              </span>
            </Label>
            <Textarea
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
              disabled={loading || !productId || !printerId}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  {d.submitting}
                </>
              ) : (
                d.submit
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
