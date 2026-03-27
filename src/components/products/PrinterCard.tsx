"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Trash2,
  Settings2,
  Plus,
  Thermometer,
  PackageX,
  Search,
  ScanLine,
  AlertTriangle,
  ChevronRight,
  X,
  Info,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";
import { AddUnitDialog } from "@/components/forms/AddUnitDialog";
import {
  PrinterData,
  PrinterSlot,
  UnitPreset,
} from "@/app/[locale]/(app)/printers/WorkshopClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockSpool {
  id: string;
  qrCodeId: string;
  currentWeight: number;
  initialWeight: number;
  priceCents: number;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  idle: {
    label: "Disponível",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  printing: {
    label: "A Imprimir",
    dot: "bg-blue-500 animate-pulse",
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  maintenance: {
    label: "Manutenção",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  offline: {
    label: "Offline",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted/50 text-muted-foreground border-border",
  },
  error: {
    label: "Erro",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

// ─── Spool Detail Modal ───────────────────────────────────────────────────────
// Shown when clicking a slot that already has a spool loaded

function SpoolDetailModal({
  slot,
  unitName,
  printerId,
  onClose,
  onUnload,
  onSwap,
}: {
  slot: PrinterSlot & {
    currentSpool: NonNullable<PrinterSlot["currentSpool"]>;
  };
  unitName: string;
  printerId: string;
  onClose: () => void;
  onUnload: (slotId: string) => void;
  onSwap: (slot: PrinterSlot) => void;
}) {
  const [unloading, setUnloading] = useState(false);
  const spool = slot.currentSpool;
  const pct = Math.round((spool.currentWeight / spool.initialWeight) * 100);

  async function handleUnload() {
    if (!confirm("Retirar este filamento do slot e devolver ao stock?")) return;
    setUnloading(true);
    try {
      const res = await fetch(
        `${SITE_URL}/api/printers/${printerId}/slots/${slot.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify({ spoolId: null }),
        },
      );
      if (!res.ok) throw new Error("Erro ao retirar filamento");
      toast({ title: "Slot esvaziado" });
      onUnload(slot.id);
      onClose();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setUnloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">
              {unitName} · Slot {slot.position}
            </p>
            <h2 className="text-sm font-semibold text-foreground mt-0.5">
              Detalhes do Filamento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Spool info */}
        <div className="p-4 space-y-4">
          {/* Color + identity */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-2 border-white/10 flex-shrink-0 shadow-inner"
              style={{ backgroundColor: spool.item.colorHex }}
            />
            <div>
              <p className="text-base font-semibold text-foreground">
                {spool.item.brand} {spool.item.material}
              </p>
              <p className="text-sm text-muted-foreground">
                {spool.item.colorName}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                #{spool.qrCodeId}
              </p>
            </div>
          </div>

          {/* Weight progress */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Peso restante</span>
              <span className="font-medium text-foreground">
                {spool.currentWeight}g / {spool.initialWeight}g
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-right">
              {pct}% restante
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => {
                onClose();
                // Small delay so the close animation doesn't conflict
                setTimeout(() => onSwap(slot), 50);
              }}
            >
              <ScanLine size={12} />
              Trocar Filamento
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleUnload}
              disabled={unloading}
            >
              <PackageX size={12} />
              Retirar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slot Assign Modal ────────────────────────────────────────────────────────
// Shown when clicking an empty slot

function SlotAssignModal({
  printerId,
  slot,
  unitName,
  unitSupportsHighTemp,
  unitSupportsAbrasive,
  onClose,
  onAssigned,
}: {
  printerId: string;
  slot: PrinterSlot;
  unitName: string;
  unitSupportsHighTemp: boolean;
  unitSupportsAbrasive: boolean;
  onClose: () => void;
  onAssigned: (slotId: string, spool: PrinterSlot["currentSpool"]) => void;
}) {
  const [tab, setTab] = useState<"picker" | "scan">("picker");
  const [stock, setStock] = useState<StockSpool[]>([]);
  const [search, setSearch] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);

  // Load available stock on mount
  useState<void>(() => {
    fetch(`${SITE_URL}/api/inventory/available`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then((data: StockSpool[]) => {
        setStock(data);
        setLoadingStock(false);
      })
      .catch(() => setLoadingStock(false));
  });

  const filtered = stock.filter(
    (s) =>
      s.item.brand.toLowerCase().includes(search.toLowerCase()) ||
      s.item.material.toLowerCase().includes(search.toLowerCase()) ||
      s.item.colorName.toLowerCase().includes(search.toLowerCase()) ||
      s.qrCodeId.toLowerCase().includes(search.toLowerCase()),
  );

  function getWarning(spool: StockSpool): string | null {
    const isAbrasive = /CF|GF|carbon|fiber/i.test(spool.item.material);
    const isHighTemp = /PA|PC|PEI|Nylon/i.test(spool.item.material);
    if (isAbrasive && !unitSupportsAbrasive)
      return `⚠️ Material abrasivo — ${unitName} não suporta filamentos com fibra.`;
    if (isHighTemp && !unitSupportsHighTemp)
      return `⚠️ Alta temperatura — ${unitName} pode não suportar este material.`;
    return null;
  }

  async function assign(spoolId: string | null) {
    setLoading(true);
    try {
      const res = await fetch(
        `${SITE_URL}/api/printers/${printerId}/slots/${slot.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify({ spoolId }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao associar");
      onAssigned(slot.id, data.currentSpool);
      toast({
        title: spoolId ? "Filamento associado ao slot" : "Slot esvaziado",
      });
      onClose();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    if (!scanValue.trim()) return;
    const found = stock.find(
      (s) => s.qrCodeId === scanValue.trim().toUpperCase(),
    );
    if (!found) {
      toast({
        title: "Rolo não encontrado",
        description: `QR "${scanValue}" não existe no inventário.`,
        variant: "destructive",
      });
      return;
    }
    const warning = getWarning(found);
    if (warning && !confirm(`${warning}\n\nDeseja continuar na mesma?`)) return;
    await assign(found.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">
              {unitName} · Slot {slot.position}
            </p>
            <h2 className="text-sm font-semibold text-foreground mt-0.5">
              Associar Filamento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border">
          {(["picker", "scan"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "picker" ? (
                <>
                  <Search size={12} />
                  Escolher da lista
                </>
              ) : (
                <>
                  <ScanLine size={12} />
                  Scan QR
                </>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "picker" && (
            <>
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Pesquisar por material, cor, marca…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
              </div>
              {loadingStock && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  A carregar inventário…
                </p>
              )}
              {!loadingStock && filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {search
                    ? `Sem resultados para "${search}"`
                    : "Sem rolos disponíveis em stock."}
                </p>
              )}
              {filtered.map((spool) => {
                const pct = Math.round(
                  (spool.currentWeight / spool.initialWeight) * 100,
                );
                const warning = getWarning(spool);
                return (
                  <button
                    key={spool.id}
                    type="button"
                    onClick={async () => {
                      if (
                        warning &&
                        !confirm(`${warning}\n\nDeseja continuar na mesma?`)
                      )
                        return;
                      await assign(spool.id);
                    }}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white/10"
                      style={{ backgroundColor: spool.item.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {spool.item.brand} {spool.item.material}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {spool.item.colorName} · {spool.currentWeight}g ({pct}%)
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        #{spool.qrCodeId}
                      </p>
                      {warning && (
                        <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={9} />
                          {warning}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0"
                    />
                  </button>
                );
              })}
            </>
          )}
          {tab === "scan" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-dashed border-border flex flex-col items-center gap-3">
                <ScanLine size={32} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center">
                  Aponta o leitor de QR ou escreve manualmente o ID do rolo.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="ex: SPL-A3F2B1"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value.toUpperCase())}
                  className="font-mono text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleScan}
                  disabled={loading || !scanValue.trim()}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Slot Grid ────────────────────────────────────────────────────────────────
// Renders all units' slots as a compact interactive grid

type PrinterUnit = PrinterData["units"][0];

function SlotGrid({
  printer,
  onSlotClick,
}: {
  printer: PrinterData;
  onSlotClick: (slot: PrinterSlot, unit: PrinterUnit) => void;
}) {
  const allUnits = printer.units;
  if (allUnits.length === 0) return null;

  return (
    <div className="space-y-2">
      {allUnits.map((unit: PrinterUnit) => (
        <div key={unit.id}>
          {allUnits.length > 1 && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {unit.name}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {unit.slots.map((slot: PrinterSlot) => {
              const hasSpool = slot.currentSpool !== null;
              return (
                <button
                  key={slot.id}
                  type="button"
                  title={
                    hasSpool
                      ? `${slot.currentSpool!.item.brand} ${slot.currentSpool!.item.material} · ${slot.currentSpool!.currentWeight}g`
                      : `Slot ${slot.position} — vazio`
                  }
                  onClick={(e) => {
                    e.stopPropagation(); // Don't navigate to printer detail
                    onSlotClick(slot, unit);
                  }}
                  className={`relative w-7 h-7 rounded-md border transition-all ${
                    hasSpool
                      ? "border-transparent hover:scale-110 hover:shadow-md"
                      : "border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
                  }`}
                  style={
                    hasSpool
                      ? {
                          backgroundColor: slot.currentSpool!.item.colorHex,
                          boxShadow: `0 0 0 1.5px ${slot.currentSpool!.item.colorHex}40`,
                        }
                      : {}
                  }
                >
                  {!hasSpool && (
                    <Plus
                      size={10}
                      className="absolute inset-0 m-auto text-muted-foreground/40"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PrinterCard ──────────────────────────────────────────────────────────────

interface PrinterCardProps {
  printer: PrinterData;
  unitPresets: UnitPreset[];
  onRefresh: () => void;
}

export function PrinterCard({
  printer,
  unitPresets,
  onRefresh,
}: PrinterCardProps) {
  const router = useRouter();
  const [localPrinter, setLocalPrinter] = useState<PrinterData>(printer);
  const [addUnitOpen, setAddUnitOpen] = useState(false);

  // Slot modal state
  const [assignSlot, setAssignSlot] = useState<{
    slot: PrinterSlot;
    unit: PrinterUnit;
  } | null>(null);
  const [detailSlot, setDetailSlot] = useState<{
    slot: PrinterSlot & {
      currentSpool: NonNullable<PrinterSlot["currentSpool"]>;
    };
    unit: PrinterUnit;
  } | null>(null);

  const statusCfg =
    STATUS_CONFIG[localPrinter.status] ?? STATUS_CONFIG["offline"];

  const totalSlots = localPrinter.units.reduce(
    (acc: number, u: PrinterUnit) => acc + u.slotCount,
    0,
  );
  const loadedSlots = localPrinter.units.reduce(
    (acc: number, u: PrinterUnit) =>
      acc + u.slots.filter((s: PrinterSlot) => s.currentSpool !== null).length,
    0,
  );
  const lastMaintenance = localPrinter.maintenanceLogs?.[0];

  // ── Handlers ──

  function handleSlotClick(slot: PrinterSlot, unit: PrinterUnit) {
    if (slot.currentSpool) {
      // Slot has a spool → show detail modal
      setDetailSlot({
        slot: slot as PrinterSlot & {
          currentSpool: NonNullable<PrinterSlot["currentSpool"]>;
        },
        unit,
      });
    } else {
      // Empty slot → show assign modal
      setAssignSlot({ slot, unit });
    }
  }

  function handleSlotAssigned(
    slotId: string,
    spool: PrinterSlot["currentSpool"],
  ) {
    setLocalPrinter((prev: PrinterData) => ({
      ...prev,
      units: prev.units.map((u: PrinterUnit) => ({
        ...u,
        slots: u.slots.map((s: PrinterSlot) =>
          s.id === slotId ? { ...s, currentSpool: spool } : s,
        ),
      })),
    }));
  }

  function handleSlotUnloaded(slotId: string) {
    handleSlotAssigned(slotId, null);
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`${SITE_URL}/api/printers/${localPrinter.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar estado");
      setLocalPrinter((p) => ({ ...p, status: newStatus }));
      toast({ title: "Estado atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!confirm("Eliminar esta impressora? Esta ação não pode ser desfeita."))
      return;
    try {
      const res = await fetch(`${SITE_URL}/api/printers/${localPrinter.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error("Erro ao eliminar");
      toast({ title: "Impressora eliminada" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  // ── Render ──

  return (
    <>
      {/* ── Modals ── */}
      {assignSlot && (
        <SlotAssignModal
          printerId={localPrinter.id}
          slot={assignSlot.slot}
          unitName={assignSlot.unit.name}
          unitSupportsHighTemp={assignSlot.unit.supportsHighTemp}
          unitSupportsAbrasive={assignSlot.unit.supportsAbrasive}
          onClose={() => setAssignSlot(null)}
          onAssigned={handleSlotAssigned}
        />
      )}
      {detailSlot && (
        <SpoolDetailModal
          slot={detailSlot.slot}
          unitName={detailSlot.unit.name}
          printerId={localPrinter.id}
          onClose={() => setDetailSlot(null)}
          onUnload={handleSlotUnloaded}
          onSwap={(slot: PrinterSlot) => {
            // Switch from detail → assign modal
            setDetailSlot(null);
            setAssignSlot({ slot, unit: detailSlot.unit });
          }}
        />
      )}
      <AddUnitDialog
        open={addUnitOpen}
        onOpenChange={setAddUnitOpen}
        printerId={localPrinter.id}
        unitPresets={unitPresets}
        onCreated={onRefresh}
      />

      {/* ── Card ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/printers/${localPrinter.id}`)}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") &&
          router.push(`/printers/${localPrinter.id}`)
        }
        className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Status dot */}
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${statusCfg.dot}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {localPrinter.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {localPrinter.preset.brand} {localPrinter.preset.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge
              className={`text-[10px] border px-1.5 py-0 h-5 ${statusCfg.badge}`}
            >
              {statusCfg.label}
            </Badge>

            {/* Context menu — stopPropagation so it doesn't navigate */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="text-xs w-48 bg-[--bg-surface]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/printers/${localPrinter.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <Info size={12} className="mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("idle");
                  }}
                  className="cursor-pointer"
                >
                  Marcar como Disponível
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("printing");
                  }}
                  className="cursor-pointer"
                >
                  Marcar como A Imprimir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("maintenance");
                  }}
                  className="cursor-pointer"
                >
                  Marcar como Manutenção
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("offline");
                  }}
                  className="cursor-pointer"
                >
                  Marcar como Offline
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddUnitOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Plus size={12} className="mr-2" />
                  Adicionar AMS / Acessório
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 size={12} className="mr-2" />
                  Eliminar Impressora
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-0 border-y border-border text-center">
          <div className="py-2.5 px-2 border-r border-border">
            <p className="text-[10px] text-muted-foreground">Horas</p>
            <p className="text-sm font-bold text-foreground">
              {Math.floor(localPrinter.totalPrintTime / 60)}h
            </p>
          </div>
          <div className="py-2.5 px-2 border-r border-border">
            <p className="text-[10px] text-muted-foreground">Slots</p>
            <p className="text-sm font-bold text-foreground">
              {loadedSlots}/{totalSlots}
            </p>
          </div>
          <div className="py-2.5 px-2">
            <p className="text-[10px] text-muted-foreground">Custo/h</p>
            <p className="text-sm font-bold text-foreground">
              €{localPrinter.hourlyCost.toFixed(2)}
            </p>
          </div>
        </div>

        {/* ── Slot grid ── */}
        <div className="p-4 space-y-3">
          {localPrinter.units.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <Layers size={11} className="text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Filamento
                </p>
              </div>
              <SlotGrid printer={localPrinter} onSlotClick={handleSlotClick} />
              {/* Capability badges */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {localPrinter.units.some((u) => u.supportsHighTemp) && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                    <Thermometer size={9} />
                    High Temp
                  </span>
                )}
                {localPrinter.units.some((u) => u.supportsAbrasive) && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5">
                    <Settings2 size={9} />
                    Abrasivo
                  </span>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddUnitOpen(true);
              }}
              className="w-full text-[11px] text-primary hover:underline text-center py-1"
            >
              + Adicionar AMS / Acessório
            </button>
          )}

          {/* Last maintenance */}
          {lastMaintenance && (
            <p className="text-[10px] text-muted-foreground border-t border-border pt-2.5">
              Última manutenção:{" "}
              <span className="font-medium text-foreground">
                {lastMaintenance.taskName}
              </span>
            </p>
          )}
        </div>

        {/* ── Footer: navigate hint ── */}
        <div className="px-4 pb-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground">
            Ver detalhes
          </span>
          <ChevronRight size={11} className="text-muted-foreground" />
        </div>
      </div>
    </>
  );
}
