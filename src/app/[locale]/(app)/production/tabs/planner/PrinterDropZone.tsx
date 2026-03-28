"use client";
// src/app/[locale]/(app)/production/tabs/planner/PrinterDropZone.tsx
//
// Zona de drop de uma impressora no Planeador.
// Valida três condições antes de aceitar um drop:
//   1. Impressora não está ocupada (status !== "printing")
//   2. Perfil do componente é compatível com o modelo desta impressora
//   3. Não há conflito de adaptador de bico

import { useState } from "react";
import {
  Printer,
  Cpu,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";
import type { Printer as PrinterType } from "../../ProductionPageClient";
import type { PendingPart } from "./types";
import { checkAdapterConflict, checkPrinterCompat } from "./planner-helpers";

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

  // ── Verificações de compatibilidade ──────────────────────────────────────
  const compat = checkPrinterCompat(printer, selectedPart);
  const isIncompat = !isBusy && compat.compat === "incompatible";
  const adapterConflict =
    !isBusy && !isIncompat && selectedPart
      ? checkAdapterConflict(printer, selectedPart)
      : { hasConflict: false, slotInfo: "" };

  // Uma impressora só aceita drop se:
  //   - não está ocupada
  //   - o perfil é compatível (ou sem restrição)
  const canAccept = !isBusy && !isIncompat;

  // ── Cor de estado ─────────────────────────────────────────────────────────
  const statusDot = isBusy
    ? "bg-amber-500"
    : isIncompat
      ? "bg-muted-foreground/30"
      : "bg-emerald-500";

  const statusLabel =
    printer.status === "printing"
      ? "Ocupada"
      : printer.status === "idle"
        ? "Disponível"
        : printer.status;

  // ── Classes do contentor ──────────────────────────────────────────────────
  const containerClass = cn(
    "rounded-xl border-2 border-dashed transition-all p-4 space-y-3",
    // Ocupada
    isBusy && "border-amber-500/40 bg-amber-500/5 cursor-not-allowed",
    // Incompatível com o perfil — tom acinzentado
    !isBusy &&
      isIncompat &&
      "border-border/40 bg-muted/20 cursor-not-allowed opacity-60",
    // Disponível + sem peça seleccionada
    !isBusy &&
      !isIncompat &&
      !selectedPart &&
      "border-border hover:border-primary/30 cursor-default",
    // Disponível + peça seleccionada + compatível
    !isBusy &&
      !isIncompat &&
      selectedPart &&
      !adapterConflict.hasConflict &&
      !dragOver &&
      "border-primary/40 bg-primary/5 cursor-pointer",
    // Drag over
    !isBusy &&
      !isIncompat &&
      dragOver &&
      "border-primary/70 bg-primary/10 scale-[1.01] cursor-pointer",
    // Conflito de adaptador (mas compatível com o modelo)
    !isBusy &&
      !isIncompat &&
      adapterConflict.hasConflict &&
      selectedPart &&
      "border-amber-500/50 bg-amber-500/5 cursor-pointer",
  );

  return (
    <div
      onDragOver={(e) => {
        if (!canAccept) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (canAccept && selectedPart) onDrop(printer, selectedPart);
      }}
      onClick={() => {
        if (canAccept && selectedPart) onDrop(printer, selectedPart);
      }}
      className={containerClass}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isBusy
                ? "bg-amber-500/10"
                : isIncompat
                  ? "bg-muted/40"
                  : "bg-primary/10",
            )}
          >
            {isBusy ? (
              <Lock size={14} className="text-amber-600" />
            ) : (
              <Printer
                size={14}
                className={
                  isIncompat ? "text-muted-foreground/50" : "text-primary"
                }
              />
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

        <div className="flex flex-col items-end gap-0.5">
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
          {/* Indicador de compatibilidade com perfil seleccionado */}
          {selectedPart && !isBusy && (
            <div className="flex items-center gap-1">
              {isIncompat ? (
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/60">
                  <XCircle size={9} className="text-muted-foreground/40" />
                  {compat.expectedModel ?? "outro modelo"}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] text-emerald-600">
                  <CheckCircle2 size={9} />
                  {compat.expectedModel
                    ? compat.expectedModel
                    : "qualquer modelo"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Banners de estado ── */}

      {/* Ocupada */}
      {isBusy && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-center gap-2">
          <Lock size={11} className="text-amber-600 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">
            A imprimir — conclui ou cancela o job actual antes de lançar outro.
          </p>
        </div>
      )}

      {/* Modelo incompatível */}
      {!isBusy && isIncompat && selectedPart && (
        <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2 flex items-start gap-2">
          <XCircle
            size={11}
            className="text-muted-foreground/50 flex-shrink-0 mt-0.5"
          />
          <p className="text-[11px] text-muted-foreground">
            Perfil para{" "}
            <span className="font-medium">
              {compat.expectedModel ?? "outro modelo"}
            </span>{" "}
            — esta impressora é{" "}
            <span className="font-medium">
              {compat.actualModel ?? "modelo diferente"}
            </span>
            .
          </p>
        </div>
      )}

      {/* Conflito adaptador */}
      {!isBusy &&
        !isIncompat &&
        adapterConflict.hasConflict &&
        selectedPart && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
            <AlertTriangle
              size={12}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-amber-700">
              {c.planner.adapterWarning.value} — {adapterConflict.slotInfo}
            </p>
          </div>
        )}

      {/* ── Slots carregados ── */}
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

      {/* ── Hint ── */}
      {canAccept && selectedPart && !adapterConflict.hasConflict && (
        <p className="text-[10px] text-primary text-center">
          Clica ou larga aqui para planear
        </p>
      )}
    </div>
  );
}
