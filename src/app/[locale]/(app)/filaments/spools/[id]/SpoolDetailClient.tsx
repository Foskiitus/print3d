"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  TrendingDown,
  TrendingUp,
  Package,
  Bell,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SpoolAdjustDialog } from "@/components/forms/SpoolAdjustDialog";
import { toast } from "@/components/ui/toaster";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { cn } from "@/lib/utils";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SpoolDetailClient({
  spool: initialSpool,
  productionUsage,
}: {
  spool: any;
  productionUsage: any[];
}) {
  const c = useIntlayer("filaments");
  const [spool, setSpool] = useState(initialSpool);
  const [alertThreshold, setAlertThreshold] = useState(
    initialSpool.alertThreshold != null
      ? String(initialSpool.alertThreshold)
      : "",
  );
  const [savingAlert, setSavingAlert] = useState(false);

  const refreshSpool = async () => {
    const res = await fetch(`/api/filaments/spools/${spool.id}/detail`);
    if (res.ok) setSpool(await res.json());
  };

  const handleSaveAlert = async () => {
    setSavingAlert(true);
    try {
      const res = await fetch(`/api/filaments/spools/${spool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertThreshold: alertThreshold !== "" ? Number(alertThreshold) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.alertSaved.value });
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingAlert(false);
    }
  };

  const handleDeleteAdjustment = async (adjustmentId: string) => {
    if (!confirm(c.toast.confirmDeleteAdjustment.value)) return;
    try {
      const res = await fetch(
        `/api/filaments/spools/${spool.id}/adjust/${adjustmentId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.adjustmentDeleted.value });
      refreshSpool();
      refreshAlerts();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalWaste = spool.adjustments
    .filter((a: any) => a.amount < 0)
    .reduce((s: number, a: any) => s + Math.abs(a.amount), 0);
  const totalCorrections = spool.adjustments
    .filter((a: any) => a.amount > 0)
    .reduce((s: number, a: any) => s + a.amount, 0);
  const totalProduced = productionUsage.reduce((s: number, log: any) => {
    const usage = log.product.filamentUsage[0];
    return s + (usage ? usage.weight * log.quantity : 0);
  }, 0);

  const percentRemaining = Math.min(
    100,
    Math.max(0, (spool.remaining / spool.spoolWeight) * 100),
  );
  const isLow = percentRemaining < 20;

  return (
    <div className="space-y-6">
      {/* ── Spool summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main card */}
        <Card className="sm:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-border/30"
                style={{
                  backgroundColor: spool.filamentType.colorHex,
                  boxShadow: `0 0 16px ${spool.filamentType.colorHex}55`,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">
                  {spool.filamentType.brand}
                </p>
                <p className="text-sm text-muted-foreground">
                  {spool.filamentType.material} · {spool.filamentType.colorName}
                </p>
              </div>
              <div className="flex-shrink-0">
                <SpoolAdjustDialog spool={spool} onAdjusted={refreshSpool} />
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span
                  className={cn(
                    "font-medium",
                    isLow ? "text-warning" : "text-foreground",
                  )}
                >
                  {spool.remaining}g {c.spool.remaining.value}
                </span>
                <span className="text-muted-foreground">
                  {c.spool.of.value} {spool.spoolWeight}g
                </span>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentRemaining}%`,
                    backgroundColor: isLow
                      ? "hsl(var(--warning))"
                      : spool.filamentType.colorHex,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={cn(isLow && "text-warning")}>
                  {percentRemaining.toFixed(0)}
                  {c.spool.percentRemaining.value}
                </span>
                <span>
                  {c.spool.purchase.value}: {formatCurrency(spool.price)} ·{" "}
                  {formatDate(spool.purchaseDate)}
                </span>
              </div>
            </div>

            {/* Minimum stock alert */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {c.spool.alertLabel.value}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="—"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                      className="h-7 w-24 text-xs pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                      g
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleSaveAlert}
                    disabled={savingAlert}
                  >
                    <Check size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wasted */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown size={14} className="text-destructive" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                {c.spool.wasted.label.value}
              </span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {totalWaste.toFixed(1)}g
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {spool.adjustments.filter((a: any) => a.amount < 0).length}{" "}
              {c.spool.wasted.adjustments.value}
            </p>
          </CardContent>
        </Card>

        {/* In Production */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package size={14} className="text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                {c.spool.inProduction.label.value}
              </span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {totalProduced.toFixed(1)}g
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {productionUsage.length} {c.spool.inProduction.productions.value}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Adjustment history ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {c.spool.adjustmentHistory.heading.value}
          </h2>

          {spool.adjustments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {c.spool.adjustmentHistory.empty.value}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {spool.adjustments.map((adj: any) => (
                <Card key={adj.id} className="bg-card border shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                            adj.amount < 0
                              ? "bg-destructive/10 text-destructive"
                              : "bg-success/10 text-success",
                          )}
                        >
                          {adj.amount < 0 ? (
                            <TrendingDown size={13} />
                          ) : (
                            <TrendingUp size={13} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-bold",
                                adj.amount < 0
                                  ? "text-destructive"
                                  : "text-success",
                              )}
                            >
                              {adj.amount > 0 ? "+" : ""}
                              {adj.amount}g
                            </span>
                            {adj.reason && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {adj.reason}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDate(adj.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleDeleteAdjustment(adj.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Production usage ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {c.spool.productionUsage.heading.value}
          </h2>

          {productionUsage.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {c.spool.productionUsage.empty.value}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {productionUsage.map((log: any) => {
                const usage = log.product.filamentUsage[0];
                const gramsUsed = usage ? usage.weight * log.quantity : 0;
                return (
                  <Card key={log.id} className="bg-card border shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate text-foreground">
                              {log.product.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] flex-shrink-0"
                            >
                              ×{log.quantity}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {log.printer.name} · {formatDate(log.date)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-display font-bold text-foreground">
                            {gramsUsed.toFixed(1)}g
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {usage?.weight}g × {log.quantity}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
