"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Printer,
  Scale,
  Archive,
  ArrowLeft,
  Clock,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SpoolIQLogo } from "@/components/ui/logo";
import { toast } from "@/components/ui/toaster";
import { useIntlayer, useLocale } from "next-intlayer";
import { cn } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface Purchase {
  id: string;
  qrCodeId: string;
  initialWeight: number;
  currentWeight: number;
  tareWeight: number;
  priceCents: number;
  boughtAt: string;
  openedAt?: string;
  archivedAt?: string;
  notes?: string;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
  supplier?: { name: string };
}

interface PrinterItem {
  id: string;
  name: string;
}

interface ProductionEntry {
  id: string;
  date: string;
  productName: string;
  printerName: string;
  quantity: number;
  filamentUsed?: number;
  totalCost?: number;
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
  const { locale } = useLocale();
  const c = useIntlayer("spool");

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-navy-400">
          {remaining}g / {usable}
          {c.functions.remainingWeight.value}
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
      <div className="h-3 rounded-full bg-theme/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor:
              pct > 50 ? colorHex : pct > 20 ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-dark-subtle">
        <span>
          {c.functions.tareLabel.value}: {tare}g
        </span>
        <span>
          {c.functions.initialGrossLabel.value}: {initial}g
        </span>
      </div>
    </div>
  );
}

export function SpoolOwnerPanel({
  purchase: initialPurchase,
  printers,
}: {
  purchase: Purchase;
  printers: PrinterItem[];
}) {
  const router = useRouter();
  const [purchase, setPurchase] = useState(initialPurchase);
  const [weighing, setWeighing] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [loadingPrinter, setLoadingPrinter] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [showPrinters, setShowPrinters] = useState(false);
  const [history, setHistory] = useState<ProductionEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const { locale } = useLocale();
  const c = useIntlayer("spool");

  const price = (purchase.priceCents / 100).toFixed(2);
  const costPerGram =
    purchase.initialWeight > 0
      ? (purchase.priceCents / 100 / purchase.initialWeight).toFixed(4)
      : "—";
  const dateBought = new Date(purchase.boughtAt).toLocaleDateString("pt-PT");
  const dateOpened = purchase.openedAt
    ? new Date(purchase.openedAt).toLocaleDateString("pt-PT")
    : "—";

  useEffect(() => {
    fetch(`${SITE_URL}/api/inventory/${purchase.id}/history`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then((d) => setHistory(d.productions ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [purchase.id]);

  const handleWeigh = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 0) return;

    const res = await fetch(`${SITE_URL}/api/inventory/${purchase.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({ currentWeight: w }),
    });

    if (res.ok) {
      setPurchase((p) => ({ ...p, currentWeight: w }));
      setWeighing(false);
      setNewWeight("");
      toast({ title: c.toast.adjustmentUpdated.value });
    }
  };

  const handleLoadPrinter = async (printerId: string) => {
    setLoadingPrinter(printerId);
    const res = await fetch(`${SITE_URL}/api/printers/${printerId}/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({ purchaseId: purchase.id }),
    });
    const data = await res.json();
    setLoadingPrinter(null);
    setShowPrinters(false);
    if (res.ok) {
      setPurchase((p) => ({ ...p, openedAt: new Date().toISOString() }));
      toast({ title: `${c.toast.spoolLoadedIn.value} ${data.printerName}` });
    }
  };

  const handleArchive = async () => {
    if (!confirm(c.toast.confirmDeleteAdjustment.value)) return;
    setArchiving(true);
    const res = await fetch(`${SITE_URL}/api/inventory/${purchase.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({ archived: true }),
    });
    setArchiving(false);
    if (res.ok) {
      toast({ title: c.toast.spoolArchived.value });
      router.push("/filaments");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-navy-400 hover:text-theme transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <SpoolIQLogo />
        </div>

        {/* Identificação */}
        <div className="card space-y-4 ">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0 border border-white/10"
              style={{
                backgroundColor: purchase.item.colorHex,
                boxShadow: `0 0 20px ${purchase.item.colorHex}55`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-xs text-green-400">
                  {c.functions.invalidSpool.value}
                </span>
              </div>
              <h1 className="text-lg font-semibold text-theme mt-1">
                {purchase.item.brand} {purchase.item.material}
              </h1>
              <p className="text-sm text-navy-400">{purchase.item.colorName}</p>
              <p className="text-xs font-mono text-dark-subtle mt-0.5">
                #{purchase.qrCodeId}
              </p>
            </div>
          </div>

          <WeightBar
            current={purchase.currentWeight}
            initial={purchase.initialWeight}
            tare={purchase.tareWeight}
            colorHex={purchase.item.colorHex}
          />
        </div>

        {/* Acções rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="relative">
            <button
              onClick={() => setShowPrinters(!showPrinters)}
              className="card flex flex-col items-center gap-2 py-4 w-full hover:border-brand-500/30 hover:bg-brand-500/5 transition-all"
            >
              <Printer className="w-6 h-6 text-brand-400" />
              <span className="text-xs text-center leading-tight">
                {c.buttons.loadInPrinter.value}
              </span>
            </button>
            {showPrinters && printers.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 z-10 rounded-lg border border-theme/40 bg-dark-surface shadow-lg overflow-hidden">
                {printers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleLoadPrinter(p.id)}
                    disabled={loadingPrinter === p.id}
                    className="w-full text-left px-3 py-2.5 text-xs text-theme hover:bg-theme/10 transition-colors disabled:opacity-50"
                  >
                    {loadingPrinter === p.id
                      ? c.loading.loadingSpool.value
                      : p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setWeighing(!weighing)}
            className="card flex flex-col items-center gap-2 py-4 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all"
          >
            <Scale className="w-6 h-6 text-brand-400" />
            <span className="text-xs  text-center leading-tight">
              {c.buttons.updateWeight.value}
            </span>
          </button>

          <button
            onClick={handleArchive}
            disabled={archiving}
            className="card flex flex-col items-center gap-2 py-4 hover:border-red-500/30 hover:bg-red-500/5 transition-all disabled:opacity-50"
          >
            <Archive className="w-6 h-6 text-red-400" />
            <span className="text-xs text-center leading-tight">
              {c.buttons.finishSpool.value}
            </span>
          </button>
        </div>

        {/* Input de peso */}
        {weighing && (
          <div className="card space-y-3">
            <p className="text-sm font-medium text-theme">
              {c.updateWeightModal.title.value} (g)
            </p>
            <p className="text-xs text-navy-400">
              {c.updateWeightModal.currentWeightLabel.value} (
              {c.updateWeightModal.tareLabel.value}: {purchase.tareWeight}g)
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder={String(purchase.currentWeight)}
                className="flex-1 px-3 py-2 rounded-lg border border-theme/40 bg-background text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors"
                autoFocus
              />
              <button
                onClick={handleWeigh}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                {c.updateWeightModal.saveButton.value}
              </button>
            </div>
          </div>
        )}

        {/* Detalhes */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-theme">
            {c.details.title.value}
          </h2>
          <div className="space-y-2.5">
            {[
              { label: c.details.labels.price.value, value: `€${price}` },
              {
                label: c.details.labels.costPerGram.value,
                value: `€${costPerGram}`,
              },
              { label: c.details.labels.boughtAt.value, value: dateBought },
              { label: c.details.labels.openedAt.value, value: dateOpened },
              purchase.supplier
                ? {
                    label: c.details.labels.supplier.value,
                    value: purchase.supplier.name,
                  }
                : null,
              purchase.notes
                ? { label: c.details.labels.notes.value, value: purchase.notes }
                : null,
            ]
              .filter(Boolean)
              .map((row: any) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-navy-400">{row.label}</span>
                  <span className="text-theme">{row.value}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Histórico de uso */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-theme flex items-center gap-2">
            <Clock className="w-4 h-4 text-navy-400" />
            {c.history.title.value}
          </h2>

          {loadingHistory ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-navy-400 py-2">
              {c.history.noHistory.value}
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-2 border-b border-theme/10 last:border-0"
                >
                  <Package className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme truncate">
                      {entry.productName}
                    </p>
                    <p className="text-xs text-navy-400">
                      {entry.printerName} ·{" "}
                      {new Date(entry.date).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-navy-400 flex-shrink-0">
                    {entry.filamentUsed != null && <p>{entry.filamentUsed}g</p>}
                    {entry.quantity > 1 && <p>{entry.quantity}×</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
