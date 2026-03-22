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
import { useIntlayer } from "next-intlayer";

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
  const c = useIntlayer("dialogs");
  const d = c.spoolAdjust;

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

  const reasons = [
    { value: "Impressão falhada", label: d.reasons.failedPrint.value },
    { value: "Bobine com peso errado", label: d.reasons.wrongWeight.value },
    { value: "Filamento partido", label: d.reasons.brokenFilament.value },
    { value: "Purga/limpeza", label: d.reasons.purge.value },
    { value: "Correção manual", label: d.reasons.manualCorrection.value },
    { value: "Outro", label: d.reasons.other.value },
  ];

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
        title: d.successTitle.value,
        description: `${d.successDesc.value} ${data.spool.remaining}g`,
      });
      setForm({ type: "waste", amount: "", reason: "" });
      setOpen(false);
      refreshAlerts();
      onAdjusted();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
          title={d.buttonTitle.value}
        >
          <SlidersHorizontal size={13} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>
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
          <div className="space-y-1.5">
            <Label>{d.typeLabel}</Label>
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
                {d.waste}
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
                {d.correction}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              {form.type === "waste" ? d.wasteAmount : d.correctionAmount}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.1"
              placeholder={
                form.type === "waste"
                  ? d.wastePlaceholder.value
                  : d.correctionPlaceholder.value
              }
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>{d.reason}</Label>
            <Select
              value={form.reason}
              onValueChange={(v) => setForm({ ...form, reason: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={d.reasonPlaceholder.value} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <span className="text-muted-foreground">{d.currentWeight}</span>
                <span>{spool.remaining}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{d.adjustment}</span>
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
                <span>{d.newWeight}</span>
                <span className={newRemaining < 0 ? "text-destructive" : ""}>
                  {newRemaining < 0 ? d.invalid : `${newRemaining.toFixed(1)}g`}
                </span>
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || newRemaining < 0 || !form.amount}
          >
            {loading ? d.submitting : d.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
