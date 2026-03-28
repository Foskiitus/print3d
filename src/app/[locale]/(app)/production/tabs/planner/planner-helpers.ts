// src/app/[locale]/(app)/production/tabs/planner/planner-helpers.ts
//
// Utilitários de display e lógica do Planeador.
// Não contém JSX nem chamadas a hooks.

import type { Printer as PrinterType } from "../../ProductionPageClient";
import type { PendingPart, PrinterCompatResult } from "./types";

export function fmtTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

// ─── Compatibilidade de impressora ────────────────────────────────────────────
//
// Verifica se o perfil do componente é compatível com a impressora.
//
// Regras:
//   - Se o perfil não tiver printerPresetId → compatível com qualquer impressora
//   - Se tiver printerPresetId → só é compatível se coincidir com o preset da impressora
//
// O match é feito por presetId (UUID), não por nome/modelo, para evitar
// falsos negativos por diferenças de capitalização.

export function checkPrinterCompat(
  printer: PrinterType,
  part: PendingPart | null,
): PrinterCompatResult {
  if (!part?.profile) {
    return { compat: "no-profile", expectedModel: null, actualModel: null };
  }

  const profilePresetId = (part.profile as any).printerPresetId ?? null;

  // Sem restrição → qualquer impressora serve
  if (!profilePresetId) {
    return { compat: "compatible", expectedModel: null, actualModel: null };
  }

  const printerPresetId = printer.preset?.id ?? null;
  const actualModel = printer.preset?.model ?? printer.preset?.name ?? null;
  const expectedModel =
    (part.profile as any).printerPreset?.model ??
    (part.profile as any).printerPreset?.name ??
    null;

  if (profilePresetId === printerPresetId) {
    return { compat: "compatible", expectedModel, actualModel };
  }

  return { compat: "incompatible", expectedModel, actualModel };
}

// ─── Conflito de adaptador ────────────────────────────────────────────────────
//
// Verifica se a peça requer filamento com fibra mas não há slot adequado.

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
