"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
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
      toast({ title: "Alerta guardado!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingAlert(false);
    }
  };

  const handleDeleteAdjustment = async (adjustmentId: string) => {
    if (!confirm("Apagar este ajuste? O peso da bobine será revertido."))
      return;
    try {
      const res = await fetch(
        `/api/filaments/spools/${spool.id}/adjust/${adjustmentId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Ajuste removido" });
      refreshSpool();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Estatísticas calculadas
  const totalWaste = spool.adjustments
    .filter((a: any) => a.amount < 0)
    .reduce((sum: number, a: any) => sum + Math.abs(a.amount), 0);

  const totalCorrections = spool.adjustments
    .filter((a: any) => a.amount > 0)
    .reduce((sum: number, a: any) => sum + a.amount, 0);

  const totalProduced = productionUsage.reduce((sum: number, log: any) => {
    const usage = log.product.filamentUsage[0];
    return sum + (usage ? usage.weight * log.quantity : 0);
  }, 0);

  const percentRemaining = Math.min(
    100,
    Math.max(0, (spool.remaining / spool.spoolWeight) * 100),
  );

  return (
    <div className="space-y-6">
      {/* ── Secção 1: Resumo da bobine ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card principal — estado atual */}
        <Card className="sm:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-full border border-white/20 flex-shrink-0"
                style={{
                  backgroundColor: spool.filamentType.colorHex,
                  boxShadow: `0 0 16px ${spool.filamentType.colorHex}55`,
                }}
              />
              <div>
                <p className="font-bold">{spool.filamentType.brand}</p>
                <p className="text-sm text-muted-foreground">
                  {spool.filamentType.material} · {spool.filamentType.colorName}
                </p>
              </div>
              <div className="ml-auto">
                <SpoolAdjustDialog spool={spool} onAdjusted={refreshSpool} />
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {spool.remaining}g restantes
                </span>
                <span className="text-muted-foreground">
                  de {spool.spoolWeight}g
                </span>
              </div>
              <div className="w-full bg-secondary/30 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentRemaining}%`,
                    backgroundColor: spool.filamentType.colorHex,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percentRemaining.toFixed(0)}% restante</span>
                <span>Compra: {formatCurrency(spool.price)}</span>
              </div>
            </div>

            {/* Alerta de stock mínimo */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Alerta abaixo de
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

        {/* Desperdício total */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} className="text-destructive" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Desperdiçado
              </span>
            </div>
            <p className="text-2xl font-bold">{totalWaste.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground mt-1">
              {spool.adjustments.filter((a: any) => a.amount < 0).length}{" "}
              ajuste(s)
            </p>
          </CardContent>
        </Card>

        {/* Produção total */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Package size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Em Produção
              </span>
            </div>
            <p className="text-2xl font-bold">{totalProduced.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground mt-1">
              {productionUsage.length} produção(ões)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Secção 2: Histórico de ajustes ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Histórico de Ajustes
          </h2>

          {spool.adjustments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum ajuste registado ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {spool.adjustments.map((adj: any) => (
                <Card key={adj.id} className="bg-muted/20 border-none">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            adj.amount < 0
                              ? "bg-destructive/15 text-destructive"
                              : "bg-green-500/15 text-green-500"
                          }`}
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
                              className={`text-sm font-bold ${
                                adj.amount < 0
                                  ? "text-destructive"
                                  : "text-green-500"
                              }`}
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

        {/* ── Secção 3: Uso em produção ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Uso em Produção
          </h2>

          {productionUsage.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Este tipo de filamento ainda não foi usado em nenhuma produção.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {productionUsage.map((log: any) => {
                const usage = log.product.filamentUsage[0];
                const gramsUsed = usage ? usage.weight * log.quantity : 0;

                return (
                  <Card key={log.id} className="bg-muted/20 border-none">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
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
                          <p className="text-sm font-bold">
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
