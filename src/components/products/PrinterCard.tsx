"use client";

import { useState } from "react";
import {
  Printer,
  Cpu,
  MoreVertical,
  Trash2,
  Plus,
  Zap,
  Clock,
  Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import {
  PrinterData,
  UnitPreset,
} from "@/app/[locale]/(app)/printers/WorkshopClient";
import { AddUnitDialog } from "../forms/AddUnitDialog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  idle: {
    label: "Disponível",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  printing: {
    label: "A imprimir",
    color: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  error: {
    label: "Erro",
    color: "text-destructive",
    dot: "bg-destructive",
  },
  maintenance: {
    label: "Manutenção",
    color: "text-amber-600",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Offline",
    color: "text-muted-foreground/50",
    dot: "bg-muted-foreground/20",
  },
};

// ─── SlotBadge ────────────────────────────────────────────────────────────────

function SlotBadge({
  slot,
}: {
  slot: { position: number; currentSpool: any | null };
}) {
  const loaded = slot.currentSpool !== null;
  const spool = slot.currentSpool;
  const pct = spool
    ? Math.round((spool.currentWeight / spool.initialWeight) * 100)
    : 0;

  return (
    <div
      title={
        loaded
          ? `${spool.item.brand} ${spool.item.material} ${spool.item.colorName} — ${pct}%`
          : `Slot ${slot.position + 1} vazio`
      }
      className={cn(
        "relative w-8 h-8 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold transition-colors",
        loaded
          ? "border-transparent text-white"
          : "border-dashed border-border text-muted-foreground/30",
      )}
      style={loaded ? { backgroundColor: spool.item.colorHex } : undefined}
    >
      {slot.position + 1}
      {loaded && (
        <span
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background text-[7px] font-bold flex items-center justify-center"
          style={{
            backgroundColor:
              pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444",
          }}
        />
      )}
    </div>
  );
}

// ─── UnitSection ─────────────────────────────────────────────────────────────

function UnitSection({ unit }: { unit: PrinterData["units"][0] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Cpu size={11} className="text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground">
          {unit.name}
        </span>
        {unit.supportsHighTemp && (
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 border-amber-400/50 text-amber-600"
          >
            High Temp
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {unit.slots.map((slot) => (
          <SlotBadge key={slot.id} slot={slot} />
        ))}
      </div>
    </div>
  );
}

// ─── PrinterCard ──────────────────────────────────────────────────────────────

export function PrinterCard({
  printer,
  unitPresets,
  onRefresh,
}: {
  printer: PrinterData;
  unitPresets: UnitPreset[];
  onRefresh: () => void;
}) {
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[printer.status] ?? STATUS_CONFIG.idle;

  const totalHours = Math.round(printer.totalPrintTime / 60);

  const handleDelete = async () => {
    if (
      !confirm(`Eliminar "${printer.name}"? Esta ação não pode ser desfeita.`)
    )
      return;
    try {
      const res = await fetch(`${SITE_URL}/api/printers/${printer.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error("Falha ao eliminar");
      toast({ title: "Impressora eliminada" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch(`${SITE_URL}/api/printers/${printer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar estado");
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Ícone */}
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Printer size={16} className="text-primary" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {printer.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {printer.preset.brand}{" "}
              {printer.preset.model ?? printer.preset.name}
            </p>
            {/* Status */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
              <span className={cn("text-[11px]", statusCfg.color)}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
            >
              <MoreVertical size={13} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-sm">
            <DropdownMenuItem onClick={() => handleStatusChange("idle")}>
              Marcar como Disponível
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("printing")}>
              Marcar como A Imprimir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("maintenance")}>
              Marcar como Manutenção
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("offline")}>
              Marcar como Offline
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddUnitOpen(true)}>
              <Plus size={12} className="mr-1.5" />
              Adicionar AMS / Acessório
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 size={12} className="mr-1.5" />
              Eliminar Impressora
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Métricas */}
      <div className="px-4 pb-3 flex items-center gap-4 text-[11px] text-muted-foreground border-b border-border">
        <span className="flex items-center gap-1">
          <Zap size={10} />
          {printer.powerWatts}W
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {totalHours}h total
        </span>
        <span className="flex items-center gap-1">
          €{printer.hourlyCost.toFixed(2)}/h
        </span>
      </div>

      {/* Unidades AMS */}
      <div className="px-4 py-3 space-y-4">
        {printer.units.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-[11px] text-muted-foreground/60">
              Sem acessórios configurados.
            </p>
            <button
              onClick={() => setAddUnitOpen(true)}
              className="mt-1.5 text-[11px] text-primary hover:underline"
            >
              + Adicionar AMS / Acessório
            </button>
          </div>
        ) : (
          printer.units.map((unit) => <UnitSection key={unit.id} unit={unit} />)
        )}
      </div>

      {/* Add Unit Dialog */}
      <AddUnitDialog
        open={addUnitOpen}
        onOpenChange={setAddUnitOpen}
        printerId={printer.id}
        unitPresets={unitPresets}
        onCreated={onRefresh}
      />
    </div>
  );
}
