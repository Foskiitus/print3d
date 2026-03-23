"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Monitor,
  Zap,
  Euro,
  QrCode,
  Wrench,
  PackageCheck,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Layers,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Thermometer,
  Search,
  Download,
  ScanLine,
  ChevronRight,
  PackageX,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/components/ui/toaster";
import { PreFlightModal } from "@/components/forms/PreFlightModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceTaskStatus {
  id: string;
  taskName: string;
  intervalHours: number;
  hoursSinceLast: number;
  progress: number;
  isDue: boolean;
}

interface SpoolInSlot {
  qrCodeId: string;
  currentWeight: number;
  initialWeight: number;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
}

interface PrinterSlot {
  id: string;
  position: number;
  currentSpool: SpoolInSlot | null;
}

interface PrinterUnit {
  id: string;
  name: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  slots: PrinterSlot[];
}

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

interface UnitPreset {
  id: string;
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
}

interface EnrichedPrinter {
  id: string;
  name: string;
  qrCodeId: string;
  status: string;
  hourlyCost: number;
  powerWatts: number;
  totalHours: number;
  totalSlots: number;
  loadedSlots: number;
  initialHours: number;
  lastMaintenanceAt: number;
  acquiredAt: string | null;
  maintenanceStatus: MaintenanceTaskStatus[];
  preset: {
    name: string;
    brand?: string;
    model?: string;
    extrusionType?: string;
  };
  units: PrinterUnit[];
  maintenanceLogs: {
    id: string;
    taskName: string;
    performedAtHours: number;
    createdAt: string;
  }[];
  printJobs: {
    id: string;
    createdAt: string;
    quantity: number;
    totalCost: number | null;
    status: string;
    items: { component: { name: string } }[];
  }[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  idle: {
    label: "Livre",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  printing: {
    label: "A Imprimir",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  maintenance: {
    label: "Manutenção",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

// ─── QR Code ──────────────────────────────────────────────────────────────────

function QrCodeImage({
  value,
  canvasRef,
}: {
  value: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, value, {
        width: 120,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [value, canvasRef]);
  return <canvas ref={canvasRef} className="rounded-lg" />;
}

async function exportQrPdf(qrCodeId: string, printerName: string) {
  const QRCode = await import("qrcode");
  const svgString = await QRCode.toString(qrCodeId, {
    type: "svg",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const w = window.open("", "_blank");
  if (!w) {
    toast({
      title: "Popup bloqueado",
      description: "Permite popups para exportar o QR.",
      variant: "destructive",
    });
    return;
  }
  w.document
    .write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR ${qrCodeId}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}
  .label{border:1.5px solid #000;border-radius:8px;padding:16px;display:inline-flex;flex-direction:column;align-items:center;gap:10px;width:180px}
  .qr svg{width:140px;height:140px;display:block}.id{font-size:11px;font-weight:bold;letter-spacing:.05em;text-align:center}
  .name{font-size:9px;color:#555;text-align:center;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  @media print{body{min-height:unset}@page{size:60mm 75mm;margin:4mm}}</style></head>
  <body><div class="label"><div class="qr">${svgString}</div><div class="id">${qrCodeId}</div><div class="name">${printerName}</div></div>
  <script>window.onload=()=>{window.print()}<\/script></body></html>`);
  w.document.close();
}

// ─── Maintenance Bar ──────────────────────────────────────────────────────────

function MaintenanceBar({ task }: { task: MaintenanceTaskStatus }) {
  const color =
    task.progress >= 100
      ? "bg-destructive"
      : task.progress >= 80
        ? "bg-amber-500"
        : "bg-primary";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.isDue ? (
            <AlertTriangle size={12} className="text-destructive" />
          ) : (
            <Wrench size={12} className="text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-foreground">
            {task.taskName}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono ${task.isDue ? "text-destructive" : "text-muted-foreground"}`}
        >
          {task.isDue
            ? "NECESSÁRIO"
            : `${task.hoursSinceLast}h / ${task.intervalHours}h`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${task.progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Slot Assignment Modal ────────────────────────────────────────────────────

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
  onAssigned: (slotId: string, spool: SpoolInSlot | null) => void;
}) {
  const [tab, setTab] = useState<"picker" | "scan">("picker");
  const [stock, setStock] = useState<StockSpool[]>([]);
  const [search, setSearch] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    fetch("/api/inventory/available")
      .then((r) => r.json())
      .then((data) => {
        setStock(data);
        setLoadingStock(false);
      })
      .catch(() => setLoadingStock(false));
  }, []);

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
      const res = await fetch(`/api/printers/${printerId}/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spoolId }),
      });
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
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">
              {unitName} · Slot {slot.position}
            </p>
            <h2 className="text-sm font-semibold text-foreground mt-0.5">
              {slot.currentSpool ? "Trocar filamento" : "Associar filamento"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        {slot.currentSpool && (
          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: slot.currentSpool.item.colorHex }}
              />
              <div>
                <p className="text-xs font-medium text-foreground">
                  {slot.currentSpool.item.brand}{" "}
                  {slot.currentSpool.item.material}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {slot.currentSpool.currentWeight}g · #
                  {slot.currentSpool.qrCodeId}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => assign(null)}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] text-destructive hover:underline"
            >
              <PackageX size={11} />
              Esvaziar
            </button>
          </div>
        )}
        <div className="flex border-b border-border">
          {(["picker", "scan"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
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
                const warning = getWarning(spool);
                const pct = Math.round(
                  (spool.currentWeight / spool.initialWeight) * 100,
                );
                return (
                  <button
                    key={spool.id}
                    type="button"
                    onClick={() => {
                      if (
                        warning &&
                        !confirm(`${warning}\n\nDeseja continuar na mesma?`)
                      )
                        return;
                      assign(spool.id);
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

// ─── Unit Manager ─────────────────────────────────────────────────────────────

function UnitManager({
  printerId,
  units,
  onChange,
}: {
  printerId: string;
  units: PrinterUnit[];
  onChange: (units: PrinterUnit[]) => void;
}) {
  const [unitPresets, setUnitPresets] = useState<UnitPreset[]>([]);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (showPicker && unitPresets.length === 0) {
      fetch("/api/printers/unit-presets")
        .then((r) => r.json())
        .then(setUnitPresets)
        .catch(() => {});
    }
  }, [showPicker, unitPresets.length]);

  const filtered = unitPresets.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.brand.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAdd(preset: UnitPreset) {
    setLoadingId(preset.id);
    try {
      const res = await fetch(`/api/printers/${printerId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: preset.id,
          name: preset.name,
          slotCount: preset.slotCount,
          supportsHighTemp: preset.supportsHighTemp,
          supportsAbrasive: preset.supportsAbrasive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `${preset.name} adicionado` });
      onChange([...units, data]);
      setShowPicker(false);
      setSearch("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRemove(unitId: string, unitName: string) {
    if (
      !confirm(
        `Remover "${unitName}"? Todos os rolos nos slots voltam ao stock automaticamente.`,
      )
    )
      return;
    setLoadingId(unitId);
    try {
      const res = await fetch(`/api/printers/${printerId}/units/${unitId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover");
      toast({ title: `${unitName} removido` });
      onChange(units.filter((u) => u.id !== unitId));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unidades de Expansão
          </h3>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <Plus size={10} />
            Adicionar
          </button>
        </div>
        {units.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Impressora simples — sem unidades de expansão.
          </p>
        ) : (
          <div className="space-y-2">
            {units.map((unit) => {
              const loaded = unit.slots.filter(
                (s) => s.currentSpool !== null,
              ).length;
              return (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers
                      size={12}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {unit.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {loaded}/{unit.slotCount} slots carregados
                        </span>
                        {unit.supportsHighTemp && (
                          <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <Thermometer size={9} />
                            alta temp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(unit.id, unit.name)}
                    disabled={loadingId === unit.id}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {showPicker && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Pesquisar AMS, MMU, ERCF…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
                autoFocus
              />
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1">
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Sem resultados
                </p>
              )}
              {filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleAdd(u)}
                  disabled={loadingId === u.id}
                  className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {u.brand} · {u.slotCount} slots
                    </p>
                  </div>
                  <Plus
                    size={12}
                    className="text-muted-foreground flex-shrink-0"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPicker(false);
                setSearch("");
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center"
            >
              Cancelar
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PrinterDashboardClient({
  printer,
}: {
  printer: EnrichedPrinter;
}) {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [name, setName] = useState(printer.name);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(printer.name);
  const [savingName, setSavingName] = useState(false);
  const [status, setStatus] = useState(printer.status);
  const [units, setUnits] = useState<PrinterUnit[]>(printer.units);
  const [maintenanceStatus, setMaintenanceStatus] = useState(
    printer.maintenanceStatus,
  );
  const [maintenanceLogs, setMaintenanceLogs] = useState(
    printer.maintenanceLogs,
  );
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{
    slot: PrinterSlot;
    unit: PrinterUnit;
  } | null>(null);

  const statusConfig =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.idle;
  const anyMaintenanceDue = maintenanceStatus.some((t) => t.isDue);
  const totalSlots =
    units.reduce((acc, u) => acc + u.slotCount, 0) || printer.totalSlots;
  const loadedSlots = units
    .flatMap((u) => u.slots)
    .filter((s) => s.currentSpool !== null).length;
  const firstSpool =
    units.flatMap((u) => u.slots).find((s) => s.currentSpool !== null)
      ?.currentSpool ?? null;

  const handleSlotAssigned = useCallback(
    (slotId: string, spool: SpoolInSlot | null) => {
      setUnits((prev) =>
        prev.map((unit) => ({
          ...unit,
          slots: unit.slots.map((s) =>
            s.id === slotId ? { ...s, currentSpool: spool } : s,
          ),
        })),
      );
    },
    [],
  );

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue === name) {
      setEditingName(false);
      setNameValue(name);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/printers/${printer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName(nameValue.trim());
      setEditingName(false);
      toast({ title: "Nome atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  async function handleMarkMaintenance(taskId: string, taskName: string) {
    try {
      const res = await fetch(`/api/printers/${printer.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registar manutenção");
      toast({ title: `"${taskName}" marcada como feita` });
      setMaintenanceStatus((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, progress: 0, hoursSinceLast: 0, isDue: false }
            : t,
        ),
      );
      setMaintenanceLogs((prev) => [
        {
          id: data.id,
          taskName,
          performedAtHours: printer.totalHours,
          createdAt: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <>
      {showPreFlight && (
        <PreFlightModal
          printerId={printer.id}
          printerName={name}
          onClose={() => setShowPreFlight(false)}
          onDispatched={() => setStatus("printing")}
        />
      )}
      {activeSlot && (
        <SlotAssignModal
          printerId={printer.id}
          slot={activeSlot.slot}
          unitName={activeSlot.unit.name}
          unitSupportsHighTemp={activeSlot.unit.supportsHighTemp}
          unitSupportsAbrasive={activeSlot.unit.supportsAbrasive}
          onClose={() => setActiveSlot(null)}
          onAssigned={handleSlotAssigned}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
              <Monitor className="text-primary" size={28} />
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="h-8 text-lg font-bold w-52"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameValue(name);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="text-primary hover:text-primary/80"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(name);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(true);
                      setNameValue(name);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {printer.preset.brand}{" "}
                {printer.preset.model ?? printer.preset.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {anyMaintenanceDue && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                <AlertTriangle size={10} className="mr-1" />
                Manutenção Necessária
              </Badge>
            )}
            <Badge className={`text-xs border ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={status === "printing"}
              onClick={() => setShowPreFlight(true)}
              title={
                status === "printing"
                  ? "Impressora já está a imprimir"
                  : undefined
              }
            >
              <PlayCircle size={14} />
              {status === "printing" ? "A Imprimir…" : "Iniciar Impressão"}
            </Button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Horas Totais
                </p>
                <p className="text-lg font-bold text-foreground">
                  {printer.totalHours}h
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Zap size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Consumo
                </p>
                <p className="text-lg font-bold text-foreground">
                  {printer.powerWatts}W
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Euro size={16} className="text-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Custo/Hora
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(printer.hourlyCost)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Layers size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Slots
                </p>
                <p className="text-lg font-bold text-foreground">
                  {loadedSlots}/{totalSlots}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Layout principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {/* Filamento / slots */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Filamento Carregado
                  </h3>
                  <PackageCheck size={14} className="text-muted-foreground" />
                </div>
                {units.length > 0 ? (
                  <div className="space-y-4">
                    {units.map((unit) => (
                      <div key={unit.id}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                          {unit.name}
                        </p>
                        <div className="space-y-1.5">
                          {unit.slots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setActiveSlot({ slot, unit })}
                              className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors w-full text-left group/slot"
                            >
                              <span className="text-[10px] font-mono text-muted-foreground w-4 flex-shrink-0">
                                {slot.position}
                              </span>
                              {slot.currentSpool ? (
                                <>
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        slot.currentSpool.item.colorHex,
                                    }}
                                  />
                                  <span className="text-xs text-foreground truncate">
                                    {slot.currentSpool.item.material}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                                    {slot.currentSpool.currentWeight}g
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-muted-foreground flex-1">
                                    vazio
                                  </span>
                                  <Plus
                                    size={10}
                                    className="text-muted-foreground/40 group-hover/slot:text-primary transition-colors flex-shrink-0"
                                  />
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : firstSpool ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/20 flex-shrink-0"
                        style={{ backgroundColor: firstSpool.item.colorHex }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {firstSpool.item.brand} {firstSpool.item.material}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {firstSpool.item.colorName}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{firstSpool.currentWeight}g restantes</span>
                        <span>
                          {Math.round(
                            (firstSpool.currentWeight /
                              firstSpool.initialWeight) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={Math.round(
                          (firstSpool.currentWeight /
                            firstSpool.initialWeight) *
                            100,
                        )}
                        className="h-1.5"
                      />
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      #{firstSpool.qrCodeId}
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Sem filamento carregado
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5 text-xs"
                    >
                      <QrCode size={12} />
                      Scan para carregar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    QR / NFC
                  </h3>
                  <QrCode size={14} className="text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4">
                  <QrCodeImage
                    value={printer.qrCodeId}
                    canvasRef={qrCanvasRef}
                  />
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {printer.qrCodeId}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ID único para check-in
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs h-7 gap-1.5"
                      onClick={() => exportQrPdf(printer.qrCodeId, name)}
                    >
                      <Download size={11} />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {printer.acquiredAt && (
              <Card>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Aquisição
                    </h3>
                    <CalendarDays size={14} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground">
                    {format(new Date(printer.acquiredAt), "dd MMM yyyy")}
                  </p>
                  {printer.preset.extrusionType && (
                    <Badge variant="outline" className="text-[10px]">
                      {printer.preset.extrusionType}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            <UnitManager
              printerId={printer.id}
              units={units}
              onChange={setUnits}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Manutenção */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Estado de Manutenção
                  </h3>
                  <Wrench size={14} className="text-muted-foreground" />
                </div>
                {maintenanceStatus.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma tarefa de manutenção definida no preset.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {maintenanceStatus.map((task) => (
                      <div key={task.id} className="space-y-2">
                        <MaintenanceBar task={task} />
                        {task.isDue && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-success border-success/30 hover:bg-success/10"
                            onClick={() =>
                              handleMarkMaintenance(task.id, task.taskName)
                            }
                          >
                            <CheckCircle2 size={11} />
                            Marcar como feita
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {maintenanceLogs.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                      Histórico recente
                    </p>
                    {maintenanceLogs.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-foreground">{log.taskName}</span>
                        <span className="text-muted-foreground">
                          {log.performedAtHours}h —{" "}
                          {format(new Date(log.createdAt), "dd/MM/yy")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Jobs recentes */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Jobs Recentes
                  </h3>
                  <Layers size={14} className="text-muted-foreground" />
                </div>
                {printer.printJobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Sem jobs de impressão ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {printer.printJobs.map((job) => {
                      const componentNames = job.items
                        .map((i) => i.component.name)
                        .join(", ");
                      const statusColor =
                        job.status === "done"
                          ? "text-emerald-500"
                          : job.status === "failed"
                            ? "text-destructive"
                            : job.status === "printing"
                              ? "text-blue-500"
                              : "text-muted-foreground";
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                              {componentNames || "Job sem componentes"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(job.createdAt), "dd/MM/yy")} ·{" "}
                              {job.quantity} unid. ·{" "}
                              <span className={statusColor}>{job.status}</span>
                            </p>
                          </div>
                          {job.totalCost != null && (
                            <span className="text-xs font-semibold text-foreground">
                              {formatCurrency(job.totalCost)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
