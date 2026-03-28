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

// Placa individual de um perfil multi-mesa
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
  quantityNeeded: number; // unidades totais pedidas para este componente nesta OP
  batchSize: number; // unidades por mesa (yield)
  printIndex: number; // qual das mesas necessárias este card representa (0-based)
  totalPrints: number; // total de mesas necessárias = ceil(quantityNeeded / batchSize)
  unitsThisPrint: number; // unidades que esta mesa produz (batchSize, excepto na última)
}

// ─── ConfirmState ─────────────────────────────────────────────────────────────

export interface ConfirmState {
  part: PendingPart;
  printer: import("../../ProductionPageClient").Printer;
  recipe: "single" | "full";
  platesNeeded: number; // quantas vezes o perfil completo é corrido
  profilePlates: ProfilePlate[]; // placas do perfil (1 se mono-mesa)
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
