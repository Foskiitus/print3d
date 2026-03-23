// src/lib/preflight/matcher.ts
//
// Algoritmo de matching de materiais para slots.
//
// Score:
//   100 → material igual + cor igual (match perfeito — sugerido automaticamente)
//    50 → material igual + cor diferente (sugerido com aviso)
//     0 → material diferente (bloqueado)

export interface RequiredMaterial {
  material: string; // ex: "PLA", "PETG", "PA6-CF"
  colorHex: string | null; // ex: "#000000"
  colorName: string | null; // ex: "Black"
  estimatedG: number;
}

export interface SlotCandidate {
  slotId: string;
  unitId: string;
  unitName: string;
  position: number;
  spoolId: string;
  spoolQrCodeId: string;
  spoolCurrentWeight: number;
  spoolInitialWeight: number;
  itemMaterial: string;
  itemColorHex: string;
  itemColorName: string;
  itemBrand: string;
  score: 100 | 50 | 0;
  scoreLabel: "perfect" | "material_only" | "incompatible";
  warning: string | null;
  hasSufficientWeight: boolean;
}

export interface MaterialMatch {
  required: RequiredMaterial;
  candidates: SlotCandidate[]; // ordenados por score desc
  suggested: SlotCandidate | null; // melhor candidato automático
  assigned: SlotCandidate | null; // escolhido pelo utilizador (null até confirmar)
  status: "ok" | "partial" | "missing" | "insufficient_weight";
}

export interface MatchResult {
  materials: MaterialMatch[];
  canProceed: boolean; // true se todos os materiais têm pelo menos um slot compatível
  warnings: string[]; // avisos de adaptador, cor errada, peso insuficiente
}

// ─── Normalização ─────────────────────────────────────────────────────────────

/** Normaliza o nome do material para comparação (case-insensitive, sem espaços) */
function normalizeMaterial(m: string): string {
  return m.toLowerCase().replace(/[\s_-]/g, "");
}

/** Compara dois hex de cor com tolerância (cores muito próximas = match) */
function colorsMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const na = a.replace("#", "").toLowerCase();
  const nb = b.replace("#", "").toLowerCase();
  if (na === nb) return true;

  // Tolerância de ±20 por canal (cores muito próximas)
  const ra = parseInt(na.slice(0, 2), 16);
  const ga = parseInt(na.slice(2, 4), 16);
  const ba = parseInt(na.slice(4, 6), 16);
  const rb = parseInt(nb.slice(0, 2), 16);
  const gb = parseInt(nb.slice(2, 4), 16);
  const bb = parseInt(nb.slice(4, 6), 16);

  return (
    Math.abs(ra - rb) <= 20 &&
    Math.abs(ga - gb) <= 20 &&
    Math.abs(ba - bb) <= 20
  );
}

/** Deteta se um material precisa de adaptador (bobines não-standard) */
function needsAdapter(brand: string, material: string): boolean {
  // Bambu Lab usa bobines proprietárias — outras marcas precisam de adaptador
  const bambuBrands = ["bambu lab", "bambu"];
  const isBambuBrand = bambuBrands.some((b) => brand.toLowerCase().includes(b));

  // Materiais CF/GF em AMS podem precisar de adaptador dependendo da unidade
  const isTechnical = /CF|GF|carbon|fiber/i.test(material);

  // Simplificação: marcas não-Bambu em impressoras Bambu precisam de adaptador
  return !isBambuBrand && isTechnical;
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

type PrinterUnitWithSlots = {
  id: string;
  name: string;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  slots: {
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
  }[];
};

export function matchMaterials(
  required: RequiredMaterial[],
  units: PrinterUnitWithSlots[],
): MatchResult {
  const warnings: string[] = [];

  // Flatten todos os slots com rolo carregado
  const loadedSlots = units.flatMap((unit) =>
    unit.slots
      .filter((s) => s.currentSpool !== null)
      .map((s) => ({ unit, slot: s, spool: s.currentSpool! })),
  );

  const materials: MaterialMatch[] = required.map((req) => {
    const candidates: SlotCandidate[] = [];

    for (const { unit, slot, spool } of loadedSlots) {
      const materialMatch =
        normalizeMaterial(spool.item.material) ===
        normalizeMaterial(req.material);

      if (!materialMatch) continue; // score 0 — não incluir como candidato

      const colorMatch = colorsMatch(req.colorHex, spool.item.colorHex);
      const score: 100 | 50 = colorMatch ? 100 : 50;
      const hasSufficientWeight = spool.currentWeight >= req.estimatedG;
      const adapter = needsAdapter(spool.item.brand, spool.item.material);

      let warning: string | null = null;
      if (!colorMatch) {
        warning = `Cor diferente: o projeto pede ${req.colorName ?? req.colorHex}, este rolo é ${spool.item.colorName}.`;
      }
      if (!hasSufficientWeight) {
        warning = `Peso insuficiente: precisas de ${req.estimatedG}g, este rolo tem ${spool.currentWeight}g.`;
      }
      if (adapter) {
        warning =
          (warning ? warning + " " : "") + "⚠️ Usa o adaptador neste slot.";
        warnings.push(
          `Slot ${unit.name} P${slot.position}: adaptador necessário para ${spool.item.brand} ${spool.item.material}.`,
        );
      }

      candidates.push({
        slotId: slot.id,
        unitId: unit.id,
        unitName: unit.name,
        position: slot.position,
        spoolId: spool.id,
        spoolQrCodeId: spool.qrCodeId,
        spoolCurrentWeight: spool.currentWeight,
        spoolInitialWeight: spool.initialWeight,
        itemMaterial: spool.item.material,
        itemColorHex: spool.item.colorHex,
        itemColorName: spool.item.colorName,
        itemBrand: spool.item.brand,
        score,
        scoreLabel: score === 100 ? "perfect" : "material_only",
        warning,
        hasSufficientWeight,
      });
    }

    // Ordenar: perfeitos primeiro, depois por peso desc
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.spoolCurrentWeight - a.spoolCurrentWeight;
    });

    // Sugestão automática: melhor candidato com peso suficiente
    const suggested =
      candidates.find((c) => c.score === 100 && c.hasSufficientWeight) ??
      candidates.find((c) => c.hasSufficientWeight) ??
      candidates[0] ??
      null;

    // Status
    let status: MaterialMatch["status"];
    if (candidates.length === 0) {
      status = "missing";
      warnings.push(
        `Material em falta: ${req.material}${req.colorName ? ` ${req.colorName}` : ""} não está carregado em nenhum slot.`,
      );
    } else if (suggested && !suggested.hasSufficientWeight) {
      status = "insufficient_weight";
      warnings.push(
        `Peso insuficiente para ${req.material}: precisas de ${req.estimatedG}g.`,
      );
    } else if (suggested && suggested.score === 50) {
      status = "partial";
    } else {
      status = "ok";
    }

    return {
      required: req,
      candidates,
      suggested,
      assigned: suggested, // pré-selecionar o melhor candidato
      status,
    };
  });

  const canProceed = materials.every(
    (m) => m.status !== "missing" && m.assigned !== null,
  );

  return { materials, canProceed, warnings };
}
