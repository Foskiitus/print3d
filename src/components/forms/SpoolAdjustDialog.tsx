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
import { refreshAlerts } from "@/lib/refreshAlerts";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const REASONS = [
  "Impressão falhada",
  "Bobine com peso errado",
  "Filamento partido",
  "Purga/limpeza",
  "Correção manual",
  "Outro",
];

export function SpoolAdjustDialog({
  spool,
  onAdjusted,
}: {
  spool: {
    id: string;
    remaining: number;
    spoolWeight: number;
    filamentType: { brand: string; colorName: string; colorHex: string };
  };
  onAdjusted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "waste", amount: "", reason: "" });

  const adjustAmount =
    form.amount === ""
      ? 0
      : form.type === "waste"
        ? -Math.abs(Number(form.amount))
        : Number(form.amount);

  const newRemaining = spool.remaining + adjustAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) === 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/filaments/spools/${spool.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: adjustAmount,
          reason: form.reason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast({
        title: "Ajuste registado",
        description: `Novo peso: ${data.spool.remaining}g`,
      });
      setForm({ type: "waste", amount: "", reason: "" });
      setOpen(false);
      refreshAlerts();
      onAdjusted();
    } catch (error: any) {
      toast({
        title: "Erro ao registar ajuste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
          title="Registar ajuste"
        >
          <SlidersHorizontal size={13} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar Ajuste de Stock</DialogTitle>
        </DialogHeader>

        {/* Info da bobine */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 text-sm">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor: spool.filamentType.colorHex,
              boxShadow: `0 0 6px ${spool.filamentType.colorHex}`,
            }}
          />
          <div>
            <span className="font-medium">{spool.filamentType.brand}</span>
            <span className="text-muted-foreground ml-1.5">
              {spool.filamentType.colorName}
            </span>
          </div>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {spool.remaining}g / {spool.spoolWeight}g
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de ajuste */}
          <div className="space-y-1.5">
            <Label>Tipo de ajuste</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "waste" })}
                className={cn(
                  "p-2.5 rounded-lg border text-sm font-medium transition-colors",
                  form.type === "waste"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                — Desperdício
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "correction" })}
                className={cn(
                  "p-2.5 rounded-lg border text-sm font-medium transition-colors",
                  form.type === "correction"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                ± Correção
              </button>
            </div>
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              {form.type === "waste"
                ? "Quantidade desperdiçada (g)"
                : "Ajuste em gramas (use - para reduzir)"}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.1"
              placeholder={form.type === "waste" ? "ex: 20" : "ex: -20 ou 15"}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select
              value={form.reason}
              onValueChange={(v) => setForm({ ...form, reason: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do resultado */}
          {form.amount !== "" && Number(form.amount) !== 0 && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm space-y-1",
                newRemaining < 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/40",
              )}
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peso atual</span>
                <span>{spool.remaining}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ajuste</span>
                {/* ✅ text-success em vez de text-green-500 */}
                <span
                  className={
                    adjustAmount < 0 ? "text-destructive" : "text-success"
                  }
                >
                  {adjustAmount > 0 ? "+" : ""}
                  {adjustAmount}g
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-border mt-1.5 pt-1.5">
                <span>Novo peso</span>
                <span className={newRemaining < 0 ? "text-destructive" : ""}>
                  {newRemaining < 0
                    ? "Inválido"
                    : `${newRemaining.toFixed(1)}g`}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || newRemaining < 0 || !form.amount}
          >
            {loading ? "A registar..." : "Confirmar Ajuste"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
