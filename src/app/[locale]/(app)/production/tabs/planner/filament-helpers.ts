// src/app/[locale]/(app)/production/tabs/planner/filament-helpers.ts
//
// Funções puras de compatibilidade de filamento.
// Usadas por ReqRow, SlotConfigModal e PlannerTab.
// Não contém JSX nem chamadas a hooks.

import type { FilamentReq } from "../../ProductionPageClient";
import type { AvailableSpool } from "./types";

export const COLOR_TOLERANCE = 30;
export const COLOR_TOLERANCE_APPROX = 80;

export function colorDist(a: string, b: string): number {
  const h = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ];
  try {
    const [ar, ag, ab] = h(a);
    const [br, bg, bb] = h(b);
    return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
  } catch {
    return 999;
  }
}

export function normalizeMaterial(material: string): string {
  return material.trim().toUpperCase();
}

// Aceita variantes do mesmo material-base.
// Ex.: requisito "PLA" aceita "PLA MATTE", "PLA+", "PLA-CF".
// NÃO aceita materiais diferentes (PETG para PLA, ABS para PLA, etc.)
export function materialsAreCompatible(
  spoolMaterial: string,
  requiredMaterial: string,
): boolean {
  const spool = normalizeMaterial(spoolMaterial);
  const req = normalizeMaterial(requiredMaterial);
  if (spool === req) return true;
  if (
    spool.startsWith(`${req} `) ||
    spool.startsWith(`${req}-`) ||
    spool.startsWith(`${req}+`)
  )
    return true;
  return false;
}

export function spoolMatchesReq(
  spool: AvailableSpool,
  req: FilamentReq,
  colorMode: "strict" | "approximate" | "ignore" = "ignore",
): boolean {
  if (!materialsAreCompatible(spool.item.material, req.material)) return false;
  if (!req.colorHex || colorMode === "ignore") return true;
  const tolerance =
    colorMode === "approximate" ? COLOR_TOLERANCE_APPROX : COLOR_TOLERANCE;
  return colorDist(spool.item.colorHex, req.colorHex) <= tolerance;
}
