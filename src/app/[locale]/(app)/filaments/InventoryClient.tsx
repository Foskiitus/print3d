"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, Droplets } from "lucide-react";
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

interface InventoryItem {
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
}

interface Purchase {
  id: string;
  qrCodeId: string;
  initialWeight: number;
  currentWeight: number;
  tareWeight: number;
  priceCents: number;
  boughtAt: string;
  openedAt?: string;
  notes?: string;
  item: InventoryItem;
  supplier?: { id: string; name: string };
}

interface Supplier {
  id: string;
  name: string;
}

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

  const { locale } = useLocale();
  const c = useIntlayer("filaments");

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-navy-400">
          {remaining} {c.functions.remainingWeight.value}
        </span>
        <span
          className={cn(
            "font-medium",
            pct <= 20
              ? "text-red-400"
              : pct <= 50
                ? "text-amber-400"
                : "text-green-400",
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-theme/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

function SpoolCard({
  purchase,
  locale,
}: {
  purchase: Purchase;
  locale: string;
}) {
  const price = (purchase.priceCents / 100).toFixed(2);
  const date = new Date(purchase.boughtAt).toLocaleDateString(
    locale === "pt" ? "pt-PT" : "en-GB",
  );

  return (
    <Link
      key={purchase.qrCodeId}
      href={`/${locale}/spool/${purchase.qrCodeId}`}
      className="block group" // Adicionamos 'group' para efeitos de hover nos filhos
    >
      <div className="card hover:border-brand-500/20 transition-all group">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/10"
            style={{
              backgroundColor: purchase.item.colorHex,
              boxShadow: `0 0 12px ${purchase.item.colorHex}44`,
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-theme truncate">
              {purchase.item.brand} {purchase.item.material}
            </p>
            <p className="text-xs text-navy-400 truncate">
              {purchase.item.colorName}
            </p>
            <p className="text-[10px] text-dark-subtle font-mono mt-0.5">
              #{purchase.qrCodeId}
            </p>
          </div>
          <span className="text-xs text-navy-400">€{price}</span>
        </div>

        <WeightBar
          current={purchase.currentWeight}
          initial={purchase.initialWeight}
          tare={purchase.tareWeight}
          colorHex={purchase.item.colorHex}
        />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme/10">
          <span className="text-[10px] text-dark-subtle">{date}</span>
          {purchase.supplier && (
            <span className="text-[10px] text-dark-subtle">
              {purchase.supplier.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function InventoryClient({
  initialPurchases,
  suppliers,
  locale,
}: {
  initialPurchases: Purchase[];
  suppliers: Supplier[];
  locale: string;
}) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [search, setSearch] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const c = useIntlayer("filaments");

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

  const handleAdded = async () => {
    // Actualiza a lista mas NÃO fecha o dialog —
    // o dialog fecha quando o utilizador clica em Concluído no step 3
    const res = await fetch("/api/inventory");
    if (res.ok) setPurchases(await res.json());
  };

  const handleFormDone = async () => {
    const res = await fetch("/api/inventory");
    if (res.ok) setPurchases(await res.json());
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {c.page.title.value}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {c.page.description.value}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-navy-400">
              {purchases.length} {c.components.spools.value}
            </span>
            {lowStockCount > 0 && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {lowStockCount} {c.components.lowStock.value}
              </span>
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              {c.components.addButton.value}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{c.components.addButton.value}</DialogTitle>
            </DialogHeader>
            <AddFilamentForm onSuccess={handleAdded} onDone={handleFormDone} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={c.components.searchPlaceholder.value}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-400 pointer-events-none" />
          <select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            className="pl-8 pr-8 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors appearance-none"
          >
            <option value="">{c.components.allMaterials.value}</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Droplets className="w-10 h-10 text-navy-400 mx-auto" />
          <p className="text-theme font-medium">
            {c.components.emptyTitle.value}
          </p>
          <p className="text-sm text-navy-400">
            {c.components.emptyDescription.value}
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
