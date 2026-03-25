"use client";

import { useState } from "react";
import { Search, Package, Tag, TrendingUp } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { StorageImage } from "@/components/StorageImage";
import { cn } from "@/lib/utils";
import type { FinishedGood } from "../InventoryPageClient";

// ─── FinishedGoodCard ─────────────────────────────────────────────────────────

function FinishedGoodCard({
  item,
  locale,
}: {
  item: FinishedGood;
  locale: string;
}) {
  const c = useIntlayer("inventory");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden group">
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {item.stockQty}
            </p>
            <p className="text-xs text-muted-foreground">
              {c.finishedGoods.units.value}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp size={11} />
              <span>{(item.margin * 100).toFixed(0)}% margem</span>
            </div>
          </div>
        </div>
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {items.length} {c.finishedGoods.products.value}
          </span>
          <span className="text-xs text-muted-foreground">
            {totalUnits} {c.finishedGoods.units.value}{" "}
            {c.finishedGoods.stockValue.value}
          </span>
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
            <FinishedGoodCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
