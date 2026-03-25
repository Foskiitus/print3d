"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Droplets,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddFilamentForm } from "@/components/forms/AddFilamentForm";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Purchase, Supplier } from "../InventoryPageClient";

// ─── WeightBar ────────────────────────────────────────────────────────────────

function WeightBar({
  current,
  initial,
  tare,
  colorHex,
}: {
  current: number;
  initial: number;
  tare: number;
  colorHex: string;
}) {
  const usable = initial - tare;
  const remaining = Math.max(0, current - tare);
  const pct = usable > 0 ? Math.round((remaining / usable) * 100) : 0;
  const barColor = pct > 50 ? colorHex : pct > 20 ? "#f59e0b" : "#ef4444";
  const c = useIntlayer("inventory");

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {remaining}g {c.filaments.remainingWeight.value}
        </span>
        <span
          className={cn(
            "font-medium",
            pct <= 20
              ? "text-red-500"
              : pct <= 50
                ? "text-amber-500"
                : "text-emerald-500",
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ─── SpoolCard ────────────────────────────────────────────────────────────────

function SpoolCard({
  purchase,
  locale,
}: {
  purchase: Purchase;
  locale: string;
}) {
  const c = useIntlayer("inventory");
  const price = (purchase.priceCents / 100).toFixed(2);
  const date = new Date(purchase.boughtAt).toLocaleDateString(
    locale === "pt" ? "pt-PT" : "en-GB",
  );

  const pricePerGram = purchase.priceCents / 100 / purchase.initialWeight;
  const loadedIn = purchase.loadedInSlot?.unit?.printer?.name ?? null;

  // Precisa de adaptador? Vem do item (globalFilamentId associado a marca que precisa)
  // Por agora usamos o alertThreshold como proxy até ter o campo requiresAdapter no item
  const needsAdapter = false; // TODO: ligar a item.requiresAdapter quando adicionado ao schema

  return (
    <Link
      href={`/${locale}/spool/${purchase.qrCodeId}`}
      className="block group"
    >
      <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all group space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/10"
            style={{
              backgroundColor: purchase.item.colorHex,
              boxShadow: `0 0 12px ${purchase.item.colorHex}44`,
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {purchase.item.brand} {purchase.item.material}
              </p>
              {needsAdapter && (
                <span title={c.filaments.needsAdapter.value}>
                  <AlertTriangle
                    size={12}
                    className="text-amber-500 flex-shrink-0 mt-0.5"
                  />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {purchase.item.colorName}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
              #{purchase.qrCodeId}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            €{price}
          </span>
        </div>

        {/* Barra de peso */}
        <WeightBar
          current={purchase.currentWeight}
          initial={purchase.initialWeight}
          tare={purchase.tareWeight}
          colorHex={purchase.item.colorHex}
        />

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-[10px] text-muted-foreground">{date}</span>
          <div className="flex items-center gap-2">
            {loadedIn && (
              <span className="flex items-center gap-1 text-[10px] text-primary">
                <Cpu size={9} />
                {loadedIn}
              </span>
            )}
            {purchase.supplier && (
              <span className="text-[10px] text-muted-foreground">
                {purchase.supplier.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── FilamentsTab ─────────────────────────────────────────────────────────────

export function FilamentsTab({
  purchases,
  suppliers,
  locale,
  onRefresh,
}: {
  purchases: Purchase[];
  suppliers: Supplier[];
  locale: string;
  onRefresh: () => void;
}) {
  const c = useIntlayer("inventory");
  const [search, setSearch] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const materials = useMemo(() => {
    const set = new Set(purchases.map((p) => p.item.material));
    return Array.from(set).sort();
  }, [purchases]);

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.item.brand.toLowerCase().includes(q) ||
        p.item.material.toLowerCase().includes(q) ||
        p.item.colorName.toLowerCase().includes(q) ||
        p.qrCodeId.toLowerCase().includes(q);
      const matchMaterial =
        !filterMaterial || p.item.material === filterMaterial;
      return matchSearch && matchMaterial;
    });
  }, [purchases, search, filterMaterial]);

  const lowStockCount = purchases.filter((p) => {
    const usable = p.initialWeight - p.tareWeight;
    const remaining = Math.max(0, p.currentWeight - p.tareWeight);
    return usable > 0 && remaining / usable <= 0.2;
  }).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {purchases.length} {c.filaments.spools.value}
          </span>
          {lowStockCount > 0 && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <Droplets size={12} />
              {lowStockCount} {c.filaments.lowStock.value}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Pesquisa */}
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={c.filaments.searchPlaceholder.value}
              className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors w-40"
            />
          </div>
          {/* Filtro material */}
          <div className="relative">
            <Filter
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="pl-7 pr-6 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
            >
              <option value="">{c.filaments.allMaterials.value}</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {/* Adicionar */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus size={14} />
                {c.filaments.addButton.value}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{c.filaments.addButton.value}</DialogTitle>
              </DialogHeader>
              <AddFilamentForm
                onSuccess={onRefresh}
                onDone={() => {
                  onRefresh();
                  setDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <Droplets
            size={32}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-muted-foreground">
            {c.filaments.empty.title.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {c.filaments.empty.description.value}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <SpoolCard key={p.id} purchase={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
