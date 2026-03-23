"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Monitor,
  Zap,
  Euro,
  ShieldCheck,
  Lock,
  AlertTriangle,
  QrCode,
  Layers,
  ChevronRight,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewPrinterDialog } from "@/components/forms/NewPrinterDialog";
import { NewPresetDialog } from "@/components/forms/NewPresetDialog";
import { toast } from "@/components/ui/toaster";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceTaskStatus {
  taskName: string;
  intervalHours: number;
  hoursSinceLast: number;
  progress: number;
  isDue: boolean;
}

interface Printer {
  id: string;
  name: string;
  qrCodeId: string;
  status: string;
  hourlyCost: number;
  powerWatts: number;
  totalHours: number;
  totalSlots: number;
  loadedSlots: number;
  maintenanceStatus: MaintenanceTaskStatus[];
  preset: {
    name: string;
    brand?: string;
    isGlobal: boolean;
  };
  currentSpool: {
    currentWeight: number;
    initialWeight: number;
    item: {
      brand: string;
      material: string;
      colorName: string;
      colorHex: string;
    };
  } | null;
}

interface Preset {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  extrusionType?: string;
  multiMaterialSlots: number;
  powerWatts: number;
  hourlyCost: number;
  isGlobal: boolean;
}

interface UnitPreset {
  id: string;
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  notes?: string;
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

// ─── Printer Card ─────────────────────────────────────────────────────────────

function PrinterCard({
  printer,
  onDelete,
}: {
  printer: Printer;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const statusConfig =
    STATUS_CONFIG[printer.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.idle;
  const anyDue = printer.maintenanceStatus.some((t) => t.isDue);
  const worstTask = printer.maintenanceStatus.reduce(
    (max, t) => (t.progress > (max?.progress ?? 0) ? t : max),
    null as MaintenanceTaskStatus | null,
  );

  const spoolPercent = printer.currentSpool
    ? Math.round(
        (printer.currentSpool.currentWeight /
          printer.currentSpool.initialWeight) *
          100,
      )
    : null;

  const hasUnits = printer.totalSlots > 1;

  return (
    <Card
      className="relative group hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => router.push(`printers/${printer.id}`)}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Monitor className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground leading-tight">
                {printer.name}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                {printer.preset.isGlobal ? (
                  <ShieldCheck size={9} className="text-primary" />
                ) : (
                  <Lock size={9} />
                )}
                {printer.preset.brand
                  ? `${printer.preset.brand} · ${printer.preset.name}`
                  : printer.preset.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {anyDue && <AlertTriangle size={13} className="text-destructive" />}
            <Badge className={`text-[10px] border ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-opacity h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(printer.id);
              }}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
              <Zap size={11} className="text-warning" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {printer.powerWatts}W
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center">
              <Euro size={11} className="text-success" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {formatCurrency(printer.hourlyCost)}/h
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Clock size={11} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {printer.totalHours}h
            </span>
          </div>
        </div>

        {/* Slots / spool */}
        {hasUnits ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 mb-3">
            <Layers size={11} className="text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground">
              {printer.loadedSlots}/{printer.totalSlots} slots carregados
            </span>
            {printer.currentSpool && (
              <>
                <span className="text-muted-foreground">·</span>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10"
                  style={{
                    backgroundColor: printer.currentSpool.item.colorHex,
                  }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {printer.currentSpool.item.material}
                </span>
              </>
            )}
          </div>
        ) : printer.currentSpool ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 mb-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10"
              style={{ backgroundColor: printer.currentSpool.item.colorHex }}
            />
            <span className="text-xs text-foreground truncate">
              {printer.currentSpool.item.brand}{" "}
              {printer.currentSpool.item.material}{" "}
              <span className="text-muted-foreground">
                · {printer.currentSpool.currentWeight}g ({spoolPercent}%)
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-dashed border-border mb-3">
            <Layers size={11} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Sem filamento carregado
            </span>
          </div>
        )}

        {/* Pior tarefa de manutenção */}
        {worstTask && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                {worstTask.isDue && (
                  <AlertTriangle size={9} className="text-destructive" />
                )}
                {worstTask.taskName}
              </span>
              <span
                className={
                  worstTask.isDue ? "text-destructive font-medium" : ""
                }
              >
                {worstTask.isDue ? "NECESSÁRIO" : `${worstTask.progress}%`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  worstTask.progress >= 100
                    ? "bg-destructive"
                    : worstTask.progress >= 80
                      ? "bg-amber-500"
                      : "bg-primary"
                }`}
                style={{ width: `${worstTask.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
            <QrCode size={9} />
            {printer.qrCodeId}
          </span>
          <ChevronRight
            size={13}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PrintersClient({
  initialPrinters,
  presets,
  unitPresets,
  isAdmin,
}: {
  initialPrinters: Printer[];
  presets: Preset[];
  unitPresets: UnitPreset[];
  isAdmin: boolean;
}) {
  const c = useIntlayer("printers");
  const [printers, setPrinters] = useState(initialPrinters);
  const [allPresets, setAllPresets] = useState(presets);

  const refreshPrinters = async () => {
    const res = await fetch("/api/printers");
    if (res.ok) setPrinters(await res.json());
  };

  const refreshPresets = async () => {
    const res = await fetch("/api/printers/presets");
    if (res.ok) setAllPresets(await res.json());
  };

  const handleDeletePrinter = async (id: string) => {
    if (!confirm(c.toast.confirmDeletePrinter.value)) return;
    try {
      const res = await fetch(`/api/printers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.printerDeleted.value });
      refreshPrinters();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm(c.toast.confirmDeletePreset.value)) return;
    try {
      const res = await fetch(`/api/printers/presets/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.presetDeleted.value });
      refreshPresets();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const globalPresets = allPresets.filter((p) => p.isGlobal);

  return (
    <div className="space-y-10">
      {/* ── Global presets (admin only) ── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {c.presets.heading.value}
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30"
              >
                {c.presets.adminBadge.value}
              </Badge>
            </div>
            <NewPresetDialog onCreated={refreshPresets} />
          </div>

          {globalPresets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
              {c.presets.empty.value}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalPresets.map((preset) => (
                <Card
                  key={preset.id}
                  className="relative group border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                          <Monitor className="text-primary" size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">
                            {preset.name}
                          </h3>
                          <p className="text-[10px] text-primary/60 mt-0.5">
                            {c.presets.globalPreset.value}
                            {preset.extrusionType &&
                              ` · ${preset.extrusionType}`}
                            {preset.multiMaterialSlots > 1 &&
                              ` · ${preset.multiMaterialSlots} slots`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-opacity h-8 w-8"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
                          <Zap size={11} className="text-warning" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {preset.powerWatts}W
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center">
                          <Euro size={11} className="text-success" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(preset.hourlyCost)}/h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My machines ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {c.myMachines.heading.value}
          </h2>
          <NewPrinterDialog
            presets={allPresets}
            unitPresets={unitPresets}
            onCreated={refreshPrinters}
          />
        </div>

        {printers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12 border border-dashed rounded-lg">
            {c.myMachines.empty.value}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map((printer) => (
              <PrinterCard
                key={printer.id}
                printer={printer}
                onDelete={handleDeletePrinter}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
