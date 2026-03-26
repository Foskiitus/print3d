"use client";

import { useState } from "react";
import { Search, Package, Tag, TrendingUp, Lock } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { StorageImage } from "@/components/StorageImage";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { FinishedGood } from "../InventoryPageClient";

// ─── FinishedGoodCard ─────────────────────────────────────────────────────────

function FinishedGoodCard({ item }: { item: FinishedGood }) {
  const c = useIntlayer("inventory");

  // Unidades livres = total em stock - reservadas para vendas pendentes
  const free = Math.max(0, item.stockQty - (item.reserved ?? 0));
  const hasReserved = (item.reserved ?? 0) > 0;
  const isLow =
    item.alertThreshold != null && item.stockQty <= item.alertThreshold;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden group transition-colors",
        isLow ? "border-warning/40" : "border-border",
      )}
    >
      {/* Imagem */}
      {item.imageUrl ? (
        <div className="aspect-video overflow-hidden bg-muted">
          <StorageImage
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted/40 flex items-center justify-center">
          <Package size={28} className="text-muted-foreground/30" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Nome + categoria */}
        <div>
          <p className="font-semibold text-sm text-foreground truncate">
            {item.name}
          </p>
          {item.category && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Tag size={9} />
              {item.category.name}
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-end justify-between gap-2">
          <div>
            {/* Total em stock */}
            <p
              className={cn(
                "text-2xl font-bold",
                item.stockQty <= 0
                  ? "text-destructive"
                  : isLow
                    ? "text-warning"
                    : "text-foreground",
              )}
            >
              {item.stockQty}
            </p>
            <p className="text-xs text-muted-foreground">
              {c.finishedGoods.units.value}
            </p>
          </div>

          <div className="text-right space-y-1">
            {/* Reservadas para vendas pendentes */}
            {hasReserved && (
              <div className="flex items-center gap-1 text-[10px] text-amber-600 justify-end">
                <Lock size={9} />
                <span>{item.reserved} reservadas</span>
              </div>
            )}
            {/* Livres */}
            {hasReserved && (
              <p className="text-[10px] text-muted-foreground">{free} livres</p>
            )}
            {/* Margem */}
            <div className="flex items-center gap-1 text-xs text-emerald-600 justify-end">
              <TrendingUp size={11} />
              <span>{(item.margin * 100).toFixed(0)}% margem</span>
            </div>
          </div>
        </div>

        {/* Barra de stock reservado */}
        {hasReserved && item.stockQty > 0 && (
          <div className="w-full bg-muted/40 rounded-full h-1 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{
                width: `${Math.min(100, ((item.reserved ?? 0) / item.stockQty) * 100)}%`,
              }}
            />
          </div>
        )}

        {/* Alerta de stock baixo */}
        {isLow && item.stockQty > 0 && (
          <p className="text-[10px] text-warning font-medium">
            ⚠ Stock abaixo do mínimo ({item.alertThreshold})
          </p>
        )}
        {item.stockQty <= 0 && (
          <p className="text-[10px] text-destructive font-medium">
            ✕ Sem stock
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FinishedGoodsTab ─────────────────────────────────────────────────────────

export function FinishedGoodsTab({
  items,
  locale,
}: {
  items: FinishedGood[];
  locale: string;
}) {
  const c = useIntlayer("inventory");
  const [search, setSearch] = useState("");

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q);
  });

  const totalUnits = items.reduce((a, b) => a + b.stockQty, 0);
  const totalReserved = items.reduce((a, b) => a + (b.reserved ?? 0), 0);
  const lowStockCount = items.filter(
    (i) => i.alertThreshold != null && i.stockQty <= i.alertThreshold,
  ).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>
            {items.length} {c.finishedGoods.products.value}
          </span>
          <span>
            {totalUnits} {c.finishedGoods.units.value}
          </span>
          {totalReserved > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <Lock size={10} />
              {totalReserved} reservadas
            </span>
          )}
          {lowStockCount > 0 && (
            <span className="text-warning font-medium">
              ⚠ {lowStockCount} produto{lowStockCount > 1 ? "s" : ""} com stock
              baixo
            </span>
          )}
        </div>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={c.finishedGoods.searchPlaceholder.value}
            className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors w-44"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <Package
            size={32}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-muted-foreground">
            {c.finishedGoods.empty.title.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            {c.finishedGoods.empty.description.value}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <FinishedGoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
