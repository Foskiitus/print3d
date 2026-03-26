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

// ─── Lógica de matching ───────────────────────────────────────────────────────

// Tolerância de cor: dois hexes são considerados "iguais" se a distância
// RGB for inferior a este threshold. Permite variações de fotografias/ecrãs.
const COLOR_TOLERANCE = 30;

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

function slotMatchesRequirement(
  slot: SlotState,
  req: FilamentRequirement,
): boolean {
  if (!slot.currentSpool) return false;
  const { item } = slot.currentSpool;

  // 1. Material tem de coincidir (case-insensitive)
  if (item.material.toLowerCase() !== req.material.toLowerCase()) return false;

  // 2. Cor: se o requisito não tem cor definida, qualquer cor serve
  if (!req.colorHex) return true;

  // 3. Cor: verifica dentro da tolerância
  const dist = colorDistance(item.colorHex, req.colorHex);
  return dist <= COLOR_TOLERANCE;
}

// ─── Função principal (usada no frontend — puro TS sem Prisma) ───────────────

export function runPreflightCheck(
  requirements: FilamentRequirement[],
  slots: SlotState[],
): PreflightResult {
  const missing: FilamentRequirement[] = [];
  const matched: PreflightResult["matched"] = [];

  // Para cada requisito, procurar um slot que o satisfaça
  // (um slot pode satisfazer vários requisitos do mesmo material/cor)
  for (const req of requirements) {
    const matchingSlot = slots.find((slot) =>
      slotMatchesRequirement(slot, req),
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
