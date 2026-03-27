// src/lib/preflight.ts
//
// Validação de pré-voo (pre-flight check) para impressões.
//
// runPreflightCheck:
//   Compara os requisitos de filamento de um componente (via perfil de impressão)
//   com o que está carregado nos slots da impressora selecionada.
//
//   Retorna:
//     { ok: true }  → pode iniciar imediatamente
//     { ok: false, missing: FilamentReq[] } → filamentos em falta ou errados

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SlotState {
  id: string;
  position: number;
  currentSpool: {
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
  } | null;
}

export interface FilamentRequirement {
  id: string;
  material: string; // ex: "PLA", "PETG"
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

export interface PreflightResult {
  ok: boolean;
  missing: FilamentRequirement[]; // requisitos não satisfeitos por nenhum slot
  matched: {
    requirement: FilamentRequirement;
    slotId: string;
    slotPosition: number;
    spoolId: string;
    spoolQrCode: string;
  }[];
}

export type PreflightColorMode = "strict" | "approximate" | "ignore";

export interface PreflightOptions {
  colorMode?: PreflightColorMode;
}

// ─── Lógica de matching ───────────────────────────────────────────────────────

// Tolerância de cor: dois hexes são considerados "iguais" se a distância
// RGB for inferior a este threshold. Permite variações de fotografias/ecrãs.
const COLOR_TOLERANCE = 30;
const COLOR_TOLERANCE_APPROX = 80;

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return 999;
  return Math.sqrt(
    Math.pow(rgbA[0] - rgbB[0], 2) +
      Math.pow(rgbA[1] - rgbB[1], 2) +
      Math.pow(rgbA[2] - rgbB[2], 2),
  );
}

function normalizeMaterial(material: string): string {
  return material.trim().toUpperCase();
}

function materialsAreCompatible(
  slotMaterial: string,
  requiredMaterial: string,
): boolean {
  const slot = normalizeMaterial(slotMaterial);
  const req = normalizeMaterial(requiredMaterial);

  if (slot === req) return true;

  // Aceita variantes do mesmo material-base.
  // Ex.: requisito "PLA" aceita "PLA MATTE", "PLA+", "PLA-CF".
  if (
    slot.startsWith(`${req} `) ||
    slot.startsWith(`${req}-`) ||
    slot.startsWith(`${req}+`)
  ) {
    return true;
  }

  return false;
}

function slotMatchesRequirement(
  slot: SlotState,
  req: FilamentRequirement,
  options?: PreflightOptions,
): boolean {
  if (!slot.currentSpool) return false;
  const { item } = slot.currentSpool;
  const colorMode = options?.colorMode ?? "strict";

  // 1. Material deve ser compatível com o requisito (inclui variantes base)
  if (!materialsAreCompatible(item.material, req.material)) return false;

  // 2. Cor: se o requisito não tem cor definida, qualquer cor serve
  if (!req.colorHex) return true;

  // 3. Cor: se o modo ignorar está activo, não bloqueia por cor
  if (colorMode === "ignore") return true;

  // 4. Cor: verifica dentro da tolerância conforme o modo
  const tolerance =
    colorMode === "approximate" ? COLOR_TOLERANCE_APPROX : COLOR_TOLERANCE;
  const dist = colorDistance(item.colorHex, req.colorHex);
  return dist <= tolerance;
}

// ─── Função principal (usada no frontend — puro TS sem Prisma) ───────────────

export function runPreflightCheck(
  requirements: FilamentRequirement[],
  slots: SlotState[],
  options?: PreflightOptions,
): PreflightResult {
  const missing: FilamentRequirement[] = [];
  const matched: PreflightResult["matched"] = [];

  // Para cada requisito, procurar um slot que o satisfaça
  // (um slot pode satisfazer vários requisitos do mesmo material/cor)
  for (const req of requirements) {
    const matchingSlot = slots.find((slot) =>
      slotMatchesRequirement(slot, req, options),
    );

    if (matchingSlot && matchingSlot.currentSpool) {
      matched.push({
        requirement: req,
        slotId: matchingSlot.id,
        slotPosition: matchingSlot.position,
        spoolId: matchingSlot.currentSpool.id,
        spoolQrCode: matchingSlot.currentSpool.qrCodeId,
      });
    } else {
      missing.push(req);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
    matched,
  };
}
