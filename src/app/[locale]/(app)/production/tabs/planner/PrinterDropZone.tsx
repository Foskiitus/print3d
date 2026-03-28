"use client";
// src/app/[locale]/(app)/production/tabs/planner/PrinterDropZone.tsx

import { useState } from "react";
import { Printer, Cpu, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";
import type { Printer as PrinterType } from "../../ProductionPageClient";
import type { PendingPart } from "./types";
import { checkAdapterConflict } from "./planner-helpers";

export function PrinterDropZone({
  printer,
  selectedPart,
  onDrop,
}: {
  printer: PrinterType;
  selectedPart: PendingPart | null;
  onDrop: (printer: PrinterType, part: PendingPart) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const c = useIntlayer("production");

  const isBusy = printer.status === "printing";

  const conflict =
    !isBusy && selectedPart
      ? checkAdapterConflict(printer, selectedPart)
      : { hasConflict: false, slotInfo: "" };

  // Cor do indicador de estado
  const statusDot =
    printer.status === "printing"
      ? "bg-amber-500"
      : printer.status === "error"
        ? "bg-red-500"
        : "bg-emerald-500";

  const statusLabel =
    printer.status === "printing"
      ? "Ocupada"
      : printer.status === "idle"
        ? "Disponível"
        : printer.status;

  return (
    <div
      onDragOver={(e) => {
        if (isBusy) return; // ignorar drag quando ocupada
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!isBusy && selectedPart) onDrop(printer, selectedPart);
      }}
      onClick={() => {
        if (!isBusy && selectedPart) onDrop(printer, selectedPart);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed transition-all p-4 space-y-3",
        // Ocupada — não interactiva
        isBusy
          ? "border-amber-500/40 bg-amber-500/5 cursor-not-allowed"
          : dragOver || selectedPart
            ? conflict.hasConflict
              ? "border-amber-500/50 bg-amber-500/5 cursor-pointer"
              : "border-primary/50 bg-primary/5 cursor-pointer"
            : "border-border hover:border-primary/30 cursor-pointer",
      )}
    >
      {/* Header da impressora */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isBusy ? "bg-amber-500/10" : "bg-primary/10",
            )}
          >
            {isBusy ? (
              <Lock size={14} className="text-amber-600" />
            ) : (
              <Printer size={14} className="text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {printer.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {printer.preset.brand}{" "}
              {printer.preset.model ?? printer.preset.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
          <span
            className={cn(
              "text-[10px] font-medium",
              isBusy ? "text-amber-600" : "text-muted-foreground",
            )}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Banner "Ocupada" */}
      {isBusy && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-center gap-2">
          <Lock size={11} className="text-amber-600 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">
            A imprimir — conclui ou cancela o job actual antes de lançar outro.
          </p>
        </div>
      )}

      {/* Alerta de adaptador */}
      {!isBusy && conflict.hasConflict && selectedPart && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
          <AlertTriangle
            size={12}
            className="text-amber-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-[11px] text-amber-700">
            {c.planner.adapterWarning.value} — {conflict.slotInfo}
          </p>
        </div>
      )}

      {/* Slots carregados */}
      {printer.units.length > 0 && (
        <div className="space-y-1.5">
          {printer.units.map((unit) => (
            <div key={unit.id}>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                <Cpu size={9} />
                {unit.name}
              </p>
              <div className="flex gap-1 flex-wrap">
                {unit.slots.map((slot) => (
                  <div
                    key={slot.id}
                    title={
                      slot.currentSpool
                        ? `${slot.currentSpool.item.brand} ${slot.currentSpool.item.material} ${slot.currentSpool.item.colorName}`
                        : `Slot ${slot.position + 1} vazio`
                    }
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center text-[9px] font-bold",
                      slot.currentSpool
                        ? "border-transparent text-white"
                        : "border-dashed border-border text-muted-foreground/30",
                    )}
                    style={
                      slot.currentSpool
                        ? { backgroundColor: slot.currentSpool.item.colorHex }
                        : undefined
                    }
                  >
                    {slot.position + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hint — só quando disponível e com peça seleccionada */}
      {!isBusy && selectedPart && !conflict.hasConflict && (
        <p className="text-[10px] text-primary text-center">
          Clica ou larga aqui para planear
        </p>
      )}
    </div>
  );
}
