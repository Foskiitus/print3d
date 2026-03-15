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
import { Factory, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function AddProductionDialog({
  products,
  printers,
  onAdded,
}: {
  products: any[];
  printers: any[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [productId, setProductId] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [printHours, setPrintHours] = useState("");
  const [printMinutes, setPrintMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const quantity = selectedProduct?.unitsPerPrint ?? 1;

  // ✅ Pré-preencher campos com valores do produto ao selecionar
  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      const totalMinutes = product.productionTime ?? 0;
      setPrintHours(
        totalMinutes > 0 ? String(Math.floor(totalMinutes / 60)) : "",
      );
      setPrintMinutes(totalMinutes > 0 ? String(totalMinutes % 60) : "");
      // ✅ Pré-selecionar impressora do produto se existir
      if (product.printerId) {
        setPrinterId(product.printerId);
      }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          printerId,
          quantity,
          printTime: printTime > 0 ? printTime : null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Não foi possível registar a produção.");

      toast({
        title: "Produção registada!",
        description: `+${quantity} unidade(s) de "${selectedProduct?.name}". Custo: ${formatCurrency(data.totalCost || 0)}`,
      });

      reset();
      setOpen(false);
      onAdded();
    } catch (error: any) {
      toast({
        title: "Produção recusada",
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
          Registar produção
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Produção</DialogTitle>
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
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.unitsPerPrint > 1 && (
                      <span className="text-muted-foreground ml-1">
                        (×{p.unitsPerPrint}/impressão)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Impressora — só leitura, vem do produto */}
          <div className="space-y-1.5">
            <Label>Impressora</Label>
            {selectedProduct?.printerId ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30 text-sm">
                <span className="font-medium">
                  {printers.find((p) => p.id === selectedProduct.printerId)
                    ?.name ?? "—"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  definida no produto
                </span>
              </div>
            ) : (
              <Select value={printerId} onValueChange={setPrinterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar impressora..." />
                </SelectTrigger>
                <SelectContent>
                  {printers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma impressora registada
                    </SelectItem>
                  ) : (
                    printers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Resumo automático do produto selecionado */}
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
                      Unidades produzidas
                    </span>
                    <span className="font-bold text-emerald-400">
                      +{quantity}
                    </span>
                  </div>
                  {totalFilament > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Filamento estimado
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
                      Calculado automaticamente ({selectedProduct.unitsPerPrint}{" "}
                      unidades/impressão)
                    </p>
                  )}
                </div>
              );
            })()}

          {/* Tempo real de impressão */}
          <div className="space-y-1.5">
            <Label>Tempo de impressão</Label>
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
                  h
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
                  min
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Pré-preenchido com o valor do produto — altere se o tempo real foi
              diferente
            </p>
          </div>

          {/* Filamento real usado */}
          {/* Notas */}
          <div className="space-y-1.5">
            <Label>
              Notas{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Textarea
              placeholder="Observações sobre esta produção..."
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
              disabled={loading || !productId || !printerId}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />A
                  processar...
                </>
              ) : (
                "Registar no Stock"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
