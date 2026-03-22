"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StockItem = {
  id: string;
  name: string;
  produced: number;
  sold: number;
  stock: number;
  category?: { name: string } | null;
  printer?: { name: string } | null;
};

type Summary = {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
};

function getStatus(stock: number): "out" | "low" | "ok" {
  if (stock <= 0) return "out";
  if (stock <= 3) return "low";
  return "ok";
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            color,
          )}
        >
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-foreground leading-none">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StockClient({
  items,
  summary,
}: {
  items: StockItem[];
  summary: Summary;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const c = useIntlayer("stock");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "out" | "low" | "ok">("all");

  // Status config built from translated labels
  const statusConfig = {
    out: {
      label: c.status.out.value,
      badge: "bg-destructive/10 text-destructive border-destructive/20",
      row: "border-l-2 border-l-destructive/40",
    },
    low: {
      label: c.status.low.value,
      badge: "bg-warning/10 text-warning border-warning/20",
      row: "border-l-2 border-l-warning/40",
    },
    ok: {
      label: c.status.ok.value,
      badge: "bg-success/10 text-success border-success/20",
      row: "border-l-2 border-l-success/40",
    },
  };

  const filtered = items
    .filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ? true : getStatus(item.stock) === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const order = { out: 0, low: 1, ok: 2 };
      return order[getStatus(a.stock)] - order[getStatus(b.stock)];
    });

  return (
    <div className="space-y-6">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label={c.summary.totalProducts.value}
          value={summary.totalProducts}
          icon={Package}
          color="bg-primary/10 text-primary"
        />
        <SummaryCard
          label={c.summary.inStock.value}
          value={summary.inStock}
          icon={CheckCircle2}
          color="bg-success/10 text-success"
        />
        <SummaryCard
          label={c.summary.lowStock.value}
          value={summary.lowStock}
          icon={AlertTriangle}
          color="bg-warning/10 text-warning"
        />
        <SummaryCard
          label={c.summary.outOfStock.value}
          value={summary.outOfStock}
          icon={TrendingDown}
          color="bg-destructive/10 text-destructive"
        />
      </div>

      {/* ── Filters + search ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={c.filters.search.value}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "ok", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {f === "all"
                ? `${c.filters.all.value} (${items.length})`
                : f === "ok"
                  ? `${c.filters.ok.value} (${summary.inStock})`
                  : f === "low"
                    ? `${c.filters.low.value} (${summary.lowStock})`
                    : `${c.filters.out.value} (${summary.outOfStock})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg py-16 text-center">
          <Package
            size={32}
            className="text-muted-foreground/40 mx-auto mb-3"
          />
          <p className="text-sm text-muted-foreground">{c.table.empty.value}</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.product.value}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">
                    {c.table.category.value}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden md:table-cell">
                    {c.table.printer.value}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">
                    {c.table.produced.value}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">
                    {c.table.sold.value}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.stock.value}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.status.value}
                  </th>
                  <th className="w-8 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const status = getStatus(item.stock);
                  const cfg = statusConfig[status];
                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        router.push(`/${locale}/products/${item.id}`)
                      }
                      className={cn(
                        "cursor-pointer hover:bg-muted/30 transition-colors",
                        cfg.row,
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {item.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {item.printer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                        <span className="flex items-center justify-end gap-1">
                          <TrendingUp size={11} className="text-success" />
                          {item.produced}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                        <span className="flex items-center justify-end gap-1">
                          <TrendingDown
                            size={11}
                            className="text-destructive"
                          />
                          {item.sold}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-display font-bold text-base tabular-nums",
                            status === "out"
                              ? "text-destructive"
                              : status === "low"
                                ? "text-warning"
                                : "text-foreground",
                          )}
                        >
                          {item.stock <= 0 ? 0 : item.stock}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {c.table.units.value}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                            cfg.badge,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ArrowRight
                          size={13}
                          className="text-muted-foreground/40"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
