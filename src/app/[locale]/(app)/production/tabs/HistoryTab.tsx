"use client";

import { useState } from "react";
import { Search, History, QrCode, Euro, Layers } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ProductionOrder } from "../ProductionPageClient";

export function HistoryTab({
  orders,
  locale,
}: {
  orders: ProductionOrder[];
  locale: string;
}) {
  const c = useIntlayer("production");
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.reference.toLowerCase().includes(q) ||
      (o.items ?? []).some((i) => i.product.name.toLowerCase().includes(q))
    );
  });

  const totalUnits = orders.reduce(
    (acc, o) => acc + (o.items ?? []).reduce((a, i) => a + i.completed, 0),
    0,
  );

  const totalCost = orders.reduce(
    (acc, o) => acc + o.printJobs.reduce((a, j) => a + (j.totalCost ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Stats rápidas */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              {c.history.units.value}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalUnits}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              {c.history.totalCost.value}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              €{totalCost.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">OPs concluídas</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {orders.length}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="relative max-w-sm">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={c.history.searchPlaceholder.value}
          className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-full"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <History
            size={32}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-muted-foreground">
            {c.history.empty.title.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {c.history.empty.description.value}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const orderCost = order.printJobs.reduce(
              (a, j) => a + (j.totalCost ?? 0),
              0,
            );
            const unitsCompleted = (order.items ?? []).reduce(
              (a, i) => a + i.completed,
              0,
            );

            return (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-foreground">
                        #{order.reference}
                      </span>
                      <Badge
                        className={cn(
                          "text-[10px] px-2 py-0 border",
                          order.status === "done"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted/50 text-muted-foreground",
                        )}
                      >
                        {order.status === "done" ? "Concluída" : "Cancelada"}
                      </Badge>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {(order.items ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Impressão direta
                        </p>
                      ) : (
                        (order.items ?? []).map((item) => (
                          <p
                            key={item.id}
                            className="text-xs text-muted-foreground"
                          >
                            {item.completed}/{item.quantity}×{" "}
                            {item.product.name}
                          </p>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-muted-foreground">
                      {unitsCompleted > 0 && (
                        <span>{unitsCompleted} un. produzidas</span>
                      )}
                      {orderCost > 0 && (
                        <span className="flex items-center gap-1">
                          <Euro size={9} />€{orderCost.toFixed(2)} total
                        </span>
                      )}
                      <span>
                        {format(new Date(order.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Print jobs com rastreabilidade */}
                {order.printJobs.length > 0 && (
                  <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2">
                    {order.printJobs.map((job) => (
                      <div key={job.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-foreground">
                            {job.printer.name}
                            {job.finishedAt && (
                              <span className="text-muted-foreground font-normal ml-2">
                                {format(
                                  new Date(job.finishedAt),
                                  "dd/MM HH:mm",
                                )}
                              </span>
                            )}
                          </span>
                          {job.totalCost && (
                            <span className="text-muted-foreground">
                              €{job.totalCost.toFixed(3)}
                            </span>
                          )}
                        </div>

                        {/* Rastreabilidade: rolos usados */}
                        {job.materials.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.materials.map((mat) => {
                              const badge = (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 border border-border">
                                  {mat.colorHex && (
                                    <div
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: mat.colorHex }}
                                    />
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {mat.material}
                                  </span>
                                  <span className="text-[10px] text-foreground">
                                    {mat.actualG ?? mat.estimatedG}g
                                  </span>
                                  {mat.spool && (
                                    <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5 font-mono">
                                      <QrCode size={8} />
                                      {mat.spool.qrCodeId.slice(-6)}
                                    </span>
                                  )}
                                </div>
                              );

                              return mat.spool ? (
                                <a
                                  key={mat.id}
                                  href={`/${locale}/spool/${mat.spool.qrCodeId}`}
                                  className="hover:opacity-70 transition-opacity"
                                  title={`Ver rolo ${mat.spool.qrCodeId}`}
                                >
                                  {badge}
                                </a>
                              ) : (
                                <div key={mat.id}>{badge}</div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
