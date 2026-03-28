import { NextRequest, NextResponse } from "next/server";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaterialReq {
  material: string;
  colorHex?: string | null;
  colorName?: string | null;
  estimatedG: number;
}

interface SlotCandidate {
  slotId: string;
  spoolId: string;
  unitName: string;
  position: number;
  itemBrand: string;
  itemMaterial: string;
  itemColorName: string;
  itemColorHex: string;
  spoolCurrentWeight: number;
  score: number; // 100 = material + cor ok, 50 = só material
  hasSufficientWeight: boolean;
  warning?: string;
}

interface MaterialMatch {
  required: MaterialReq;
  candidates: SlotCandidate[];
  assigned: SlotCandidate | null;
  status: "ok" | "missing" | "insufficient_weight";
}

interface MatchResult {
  canProceed: boolean;
  warnings: string[];
  materials: MaterialMatch[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// A cor é sempre ignorada na análise — o utilizador escolhe explicitamente
// qual spool usar no Step 2 do modal. O matching é só por material-base.

function normalizeMaterial(m: string) {
  return m.trim().toUpperCase();
}

// Aceita variantes do mesmo material-base:
// ex.: requisito "PLA" aceita "PLA MATTE", "PLA+", "PLA-CF"
function materialsAreCompatible(spoolMat: string, reqMat: string): boolean {
  const spool = normalizeMaterial(spoolMat);
  const req = normalizeMaterial(reqMat);
  if (spool === req) return true;
  if (
    spool.startsWith(`${req} `) ||
    spool.startsWith(`${req}-`) ||
    spool.startsWith(`${req}+`)
  )
    return true;
  return false;
}

// Score binário — 100 se o material é compatível, 0 caso contrário.
// Cor ignorada: o utilizador decide qual cor usar no Step 2.
function scoreSlot(
  slot: {
    currentSpool: {
      item: {
        material: string;
        colorHex: string;
        colorName: string;
        brand: string;
      };
      currentWeight: number;
    } | null;
  },
  req: MaterialReq,
): number {
  if (!slot.currentSpool) return 0;
  return materialsAreCompatible(slot.currentSpool.item.material, req.material)
    ? 100
    : 0;
}

// ─── Prisma result types ──────────────────────────────────────────────────────

type SpoolWithItem = {
  id: string;
  currentWeight: number;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
};

type SlotWithSpool = {
  id: string;
  position: number;
  currentSpool: SpoolWithItem | null;
};

type UnitWithSlots = {
  id: string;
  name: string;
  slots: SlotWithSpool[];
};

type FilamentReqRow = {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
};

// ─── POST /api/printers/[id]/preflight/analyze ────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const userId = await requirePageAuth();
  const { id: printerId } = await params;

  // 1. Verificar impressora do utilizador — include explícito para ter units+slots
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    include: {
      units: {
        include: {
          slots: {
            include: {
              currentSpool: {
                include: { item: true },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  const units = printer.units as UnitWithSlots[];

  // 2. Ler body
  const body = await req.json().catch(() => ({}));

  // 3. Obter requisitos de material
  let requirements: MaterialReq[] = [];
  let estimatedMinutes: number | null = null;

  if (body.materials && Array.isArray(body.materials)) {
    // Modo manual — materiais passados directamente pelo cliente
    requirements = body.materials as MaterialReq[];
    estimatedMinutes = body.estimatedMinutes ?? null;
  } else if (body.profileId) {
    // Modo automático — buscar requisitos do perfil de impressão
    const profile = await prisma.componentPrintProfile.findFirst({
      where: { id: body.profileId as string },
      include: {
        filaments: true,
        component: { select: { userId: true, requiresAdapter: true } },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 },
      );
    }
    if (profile.component.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (profile.filaments.length === 0) {
      return NextResponse.json({
        source: "manual_required",
        message:
          "Este perfil não tem requisitos de filamento definidos. Introduz os materiais manualmente.",
      });
    }

    estimatedMinutes = profile.printTime ?? null;
    const quantity: number = Number(body.quantity ?? 1);

    requirements = (profile.filaments as FilamentReqRow[]).map((f) => ({
      material: f.material,
      colorHex: f.colorHex,
      colorName: f.colorName,
      estimatedG: f.estimatedG * quantity,
    }));
  } else if (body.productId) {
    // Produto seleccionado mas sem perfil → agregar requisitos da BOM
    const product = await prisma.product.findFirst({
      where: { id: body.productId as string, userId },
      include: {
        bom: {
          include: {
            component: {
              include: {
                profiles: {
                  include: { filaments: true },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!product || product.bom.length === 0) {
      return NextResponse.json({
        source: "manual_required",
        message: "Produto sem BOM definida. Introduz os materiais manualmente.",
      });
    }

    const quantity: number = Number(body.quantity ?? 1);

    const allFilaments: MaterialReq[] = product.bom.flatMap(
      (entry: {
        quantity: number;
        component: { profiles: { filaments: FilamentReqRow[] }[] };
      }) => {
        const profile = entry.component.profiles[0];
        if (!profile) return [];
        return (profile.filaments as FilamentReqRow[]).map((f) => ({
          material: f.material,
          colorHex: f.colorHex,
          colorName: f.colorName,
          estimatedG: f.estimatedG * entry.quantity * quantity,
        }));
      },
    );

    if (allFilaments.length === 0) {
      return NextResponse.json({
        source: "manual_required",
        message:
          "Os componentes deste produto não têm perfis com requisitos de filamento. Introduz manualmente.",
      });
    }

    // Consolidar requisitos do mesmo material+cor
    const consolidated = new Map<string, MaterialReq>();
    for (const f of allFilaments) {
      const key = `${normalizeMaterial(f.material)}|${f.colorHex ?? ""}`;
      const existing = consolidated.get(key);
      if (existing) {
        existing.estimatedG += f.estimatedG;
      } else {
        consolidated.set(key, { ...f });
      }
    }
    requirements = Array.from(consolidated.values());
    estimatedMinutes = body.estimatedMinutes ?? null;
  } else {
    return NextResponse.json(
      { error: "Fornece profileId, productId ou materials[]" },
      { status: 400 },
    );
  }

  if (requirements.length === 0) {
    return NextResponse.json({
      source: "manual_required",
      message:
        "Sem requisitos de filamento. Introduz os materiais manualmente.",
    });
  }

  // 4. Recolher todos os slots com spool carregado
  const allSlots = units.flatMap((unit: UnitWithSlots) =>
    unit.slots
      .filter((s: SlotWithSpool) => s.currentSpool !== null)
      .map((s: SlotWithSpool) => ({ ...s, unitName: unit.name })),
  );

  // Helper: constrói os candidatos de um requisito a partir dos slots disponíveis
  function buildCandidates(
    slots: (SlotWithSpool & { unitName: string })[],
    req: MaterialReq,
  ): SlotCandidate[] {
    return slots
      .map((slot) => {
        const score = scoreSlot(slot, req);
        if (score === 0) return null;

        const spool = slot.currentSpool!;
        const hasSufficientWeight = spool.currentWeight >= req.estimatedG;
        const needsAdapter = /CF|GF|carbon|fiber/i.test(spool.item.material);

        const candidate: SlotCandidate = {
          slotId: slot.id,
          spoolId: spool.id,
          unitName: slot.unitName,
          position: slot.position,
          itemBrand: spool.item.brand,
          itemMaterial: spool.item.material,
          itemColorName: spool.item.colorName,
          itemColorHex: spool.item.colorHex,
          spoolCurrentWeight: spool.currentWeight,
          score,
          hasSufficientWeight,
          ...(needsAdapter
            ? {
                warning:
                  "Material com fibra — pode precisar de adaptador de bico.",
              }
            : {}),
        };
        return candidate;
      })
      .filter((c): c is SlotCandidate => c !== null)
      .sort((a, b) => {
        // Ordenar: score DESC, depois peso suficiente primeiro
        if (b.score !== a.score) return b.score - a.score;
        return a.hasSufficientWeight === b.hasSufficientWeight
          ? 0
          : a.hasSufficientWeight
            ? -1
            : 1;
      });
  }

  // 5. Atribuição exclusiva greedy — cada slot só pode ser atribuído a um requisito.
  //
  // Algoritmo:
  //   a) Para cada requisito calcular todos os candidatos (sem restrições)
  //   b) Ordenar os requisitos por "dificuldade" — menos candidatos primeiro,
  //      para que os requisitos mais difíceis de satisfazer tenham prioridade
  //      na escolha do slot.
  //   c) Atribuir o melhor slot disponível a cada requisito, marcando-o como usado.

  // a) Calcular candidatos para todos os requisitos
  type ReqWithCandidates = {
    req: MaterialReq;
    originalIndex: number;
    candidates: SlotCandidate[];
  };

  const reqsWithCandidates: ReqWithCandidates[] = requirements.map(
    (req, i) => ({
      req,
      originalIndex: i,
      candidates: buildCandidates(allSlots, req),
    }),
  );

  // b) Ordenar por número de candidatos ASC (mais difíceis primeiro)
  const sorted = [...reqsWithCandidates].sort(
    (a, b) => a.candidates.length - b.candidates.length,
  );

  // c) Atribuição exclusiva
  const usedSlotIds = new Set<string>();
  const assignments = new Map<number, SlotCandidate | null>();

  for (const { req, originalIndex, candidates } of sorted) {
    // Escolher o melhor candidato que ainda não foi atribuído
    const best = candidates.find((c) => !usedSlotIds.has(c.slotId)) ?? null;
    if (best) usedSlotIds.add(best.slotId);
    assignments.set(originalIndex, best);
  }

  // Reconstruir materials na ordem original.
  // IMPORTANTE: os candidatos devolvidos são TODOS os slots compatíveis,
  // sem filtro de exclusividade. A exclusividade (greedy) só determina a
  // atribuição automática inicial — o utilizador pode trocar manualmente
  // no Step 2 e ver todos os slots disponíveis para cada requisito.
  // O aviso de conflito (dois requisitos no mesmo slot) é feito no cliente.
  const materials: MaterialMatch[] = reqsWithCandidates.map(
    ({ req, originalIndex, candidates }) => {
      const best = assignments.get(originalIndex) ?? null;

      // score é 100 ou 0 — sem "partial"
      let status: MaterialMatch["status"] = "missing";
      if (best) {
        status = best.hasSufficientWeight ? "ok" : "insufficient_weight";
      }

      // Devolver todos os candidatos para que o utilizador possa escolher
      // qualquer slot compatível, incluindo os já atribuídos a outros requisitos
      return { required: req, candidates, assigned: best, status };
    },
  );

  // 6. Construir resultado global
  const warnings: string[] = [];
  for (const m of materials) {
    if (m.status === "missing") {
      warnings.push(
        `${m.required.material} — sem slot com material compatível carregado.`,
      );
    } else if (m.status === "insufficient_weight") {
      warnings.push(
        `${m.required.material} — peso insuficiente (necessário ${m.required.estimatedG}g, disponível ${m.assigned?.spoolCurrentWeight ?? 0}g).`,
      );
    }
    if (m.assigned?.warning) warnings.push(m.assigned.warning);
  }

  const canProceed = materials.every((m) => m.status === "ok");

  const matchResult: MatchResult = { canProceed, warnings, materials };

  return NextResponse.json({
    source: "profile",
    estimatedMinutes,
    matchResult,
  });
}
