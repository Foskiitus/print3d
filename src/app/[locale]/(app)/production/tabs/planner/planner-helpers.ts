// src/app/[locale]/(app)/production/tabs/planner/planner-helpers.ts
//
// Utilitários de display do Planeador.
// Não contém JSX nem chamadas a hooks.

import type { Printer as PrinterType } from "../../ProductionPageClient";
import type { PendingPart } from "./types";

export function fmtTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

// Verifica se a peça a imprimir requer filamento com fibra (CF/GF)
// mas não há slot carregado com esse material.
// Devolve { hasConflict, slotInfo } para uso no UI.
export function checkAdapterConflict(
  printer: PrinterType,
  part?: PendingPart | null,
): { hasConflict: boolean; slotInfo: string } {
  if (!part) return { hasConflict: false, slotInfo: "" };

  const fiberReqs = (part.profile?.filaments ?? []).filter((f) =>
    /CF|GF|carbon|fiber/i.test(f.material),
  );
  if (fiberReqs.length === 0) return { hasConflict: false, slotInfo: "" };

  const hasFiberSlot = (printer.units ?? []).some((u) =>
    u.slots.some((s) =>
      /CF|GF|carbon|fiber/i.test(s.currentSpool?.item?.material ?? ""),
    ),
  );

  if (!hasFiberSlot) {
    const mats = fiberReqs.map((f) => f.material).join(", ");
    return {
      hasConflict: true,
      slotInfo: `Requer ${mats} — verifica o adaptador de bico`,
    };
  }

  return { hasConflict: false, slotInfo: "" };
}
