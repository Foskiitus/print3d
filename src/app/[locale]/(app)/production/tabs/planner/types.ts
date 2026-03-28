// src/app/[locale]/(app)/production/tabs/planner/types.ts
//
// Tipos locais partilhados por todos os ficheiros do Planeador.
// Não contém JSX nem lógica — apenas interfaces e constantes.

import type {
  Component,
  ComponentProfile,
  FilamentReq,
} from "../../ProductionPageClient";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── ProfilePlate ─────────────────────────────────────────────────────────────

export interface ProfilePlate {
  plateNumber: number;
  name: string | null;
  printTime: number | null;
  batchSize: number;
  filaments: FilamentReq[];
}

// ─── PendingPart ──────────────────────────────────────────────────────────────

export interface PendingPart {
  orderId: string;
  orderRef: string;
  isUrgent: boolean;
  component: Component;
  profile: ComponentProfile | null;
  quantityNeeded: number;
  batchSize: number;
  printIndex: number;
  totalPrints: number;
  unitsThisPrint: number;
}

// ─── ConfirmState ─────────────────────────────────────────────────────────────

export interface ConfirmState {
  part: PendingPart;
  printer: import("../../ProductionPageClient").Printer;
  recipe: "single" | "full";
  platesNeeded: number;
  profilePlates: ProfilePlate[];
}

// ─── AvailableSpool ───────────────────────────────────────────────────────────

export interface AvailableSpool {
  id: string;
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

// ─── PrinterCompat ────────────────────────────────────────────────────────────
//
// Resultado da verificação de compatibilidade entre um perfil e uma impressora.
//   "compatible"   — sem restrição, ou modelo coincide
//   "incompatible" — perfil tem printerPresetId diferente do preset desta impressora
//   "no-profile"   — componente não tem perfil definido (não é possível validar)

export type PrinterCompatibility = "compatible" | "incompatible" | "no-profile";

export interface PrinterCompatResult {
  compat: PrinterCompatibility;
  // Modelo esperado pelo perfil (ex: "P1S") — para mostrar no aviso
  expectedModel: string | null;
  // Modelo real da impressora (ex: "A1")
  actualModel: string | null;
}
