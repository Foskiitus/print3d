import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeProductionOrder } from "@/lib/production";

interface Params {
  params: Promise<{ id: string }>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignedMaterial {
  material: string;
  colorHex?: string | null;
  colorName?: string | null;
  estimatedG: number;
  slotId?: string | null;
  spoolId?: string | null;
  matchScore?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeMaterial(m: string) {
  return m.trim().toUpperCase();
}

// Aceita variantes do mesmo material-base — PLA+ / PLA Matte / PLA-CF para PLA.
// NÃO aceita materiais diferentes — PETG para PLA, ABS para PLA, etc.
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

// ─── POST /api/printers/[id]/preflight/dispatch ────────────────────────────────
//
// Recebe a seleção confirmada do utilizador e, numa transação:
//   1. Valida compatibilidade de material de cada spool (cor pode ser diferente)
//   2. Cria uma OP ad-hoc com referência no formato OP-YYYY-NNNN (igual às OPs normais)
//   3. Se foi selecionado um produto, cria um OrderItem na OP
//   4. Cria o PrintJob com status "printing" ligado à OP
//   5. Cria os PrintJobItem e PrintJobMaterial
//   6. Atualiza o status da impressora para "printing"

export async function POST(req: NextRequest, { params }: Params) {
  // Usar requireApiAuth igual a todas as outras rotas de produção
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: printerId } = await params;

  // 1. Verificar que a impressora pertence ao utilizador
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    select: { id: true, name: true },
  });
  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));

  const {
    productId,
    profileId,
    quantity = 1,
    estimatedMinutes,
    materials,
  }: {
    productId?: string | null;
    profileId?: string | null;
    quantity?: number;
    estimatedMinutes?: number | null;
    materials: AssignedMaterial[];
  } = body;

  if (!Array.isArray(materials) || materials.length === 0) {
    return NextResponse.json(
      { error: "Lista de materiais em falta" },
      { status: 400 },
    );
  }

  // 2. Validar compatibilidade de material para cada spool atribuído.
  //    A COR pode ser diferente (escolha intencional do utilizador),
  //    mas o MATERIAL-BASE tem de ser compatível.
  for (const m of materials) {
    if (!m.spoolId) continue;

    const spool = await prisma.inventoryPurchase.findFirst({
      where: { id: m.spoolId, userId },
      include: { item: { select: { material: true } } },
    });

    if (!spool) {
      return NextResponse.json(
        { error: `Rolo ${m.spoolId} não encontrado` },
        { status: 404 },
      );
    }

    if (!materialsAreCompatible(spool.item.material, m.material)) {
      return NextResponse.json(
        {
          error: `Material incompatível: o rolo é "${spool.item.material}" mas o requisito é "${m.material}". Materiais base diferentes não são permitidos.`,
        },
        { status: 422 },
      );
    }
  }

  // 3. Resolver nome do produto e componentId para a referência da OP
  let productName: string | null = null;
  let componentId: string | null = null;

  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
      select: { name: true },
    });
    productName = product?.name ?? null;
  }

  if (profileId) {
    const profile = await prisma.componentPrintProfile.findUnique({
      where: { id: profileId },
      select: { componentId: true },
    });
    componentId = profile?.componentId ?? null;
  }

  // 4. Gerar referência no mesmo formato das OPs normais: OP-YYYY-NNNN
  //    Assim aparece no histórico com o mesmo aspeto e é fácil de encontrar
  const count = await prisma.productionOrder.count({ where: { userId } });
  const orderReference = `OP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  // Nota para identificar que é uma OP de impressão direta
  const orderNotes = [
    "Criada automaticamente via impressão direta.",
    productName ? `Produto: ${productName}.` : null,
    `Impressora: ${printer.name}.`,
  ]
    .filter(Boolean)
    .join(" ");

  // 5. Buscar a cor e material reais de cada spool atribuído.
  //    O spoolId é obrigatório — não é possível iniciar impressão sem saber
  //    que spool está carregado. Guardamos sempre os dados do spool real,
  //    independentemente da cor do requisito original.
  const spoolColorMap = new Map<
    string,
    { colorHex: string; colorName: string; material: string }
  >();
  for (const m of materials) {
    if (!m.spoolId) {
      return NextResponse.json(
        {
          error: `Material "${m.material}" não tem spool atribuído. Todos os materiais precisam de um spool carregado.`,
        },
        { status: 400 },
      );
    }
    const spool = await prisma.inventoryPurchase.findUnique({
      where: { id: m.spoolId },
      select: {
        item: { select: { colorHex: true, colorName: true, material: true } },
      },
    });
    if (spool) spoolColorMap.set(m.spoolId, spool.item);
  }

  // 6. Criar tudo numa transação atómica
  const { job, order } = await prisma.$transaction(async (tx) => {
    // 6a. OP ad-hoc em estado "in_progress"
    const newOrder = await tx.productionOrder.create({
      data: {
        userId,
        reference: orderReference,
        status: "in_progress",
        notes: orderNotes,
      },
    });

    // 6b. OrderItem — se foi selecionado um produto
    if (productId) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId,
          quantity: Number(quantity),
          completed: 0,
        },
      });
    }

    // 6c. PrintJob ligado à OP
    const newJob = await tx.printJob.create({
      data: {
        userId,
        printerId,
        orderId: newOrder.id,
        status: "printing",
        quantity: Number(quantity),
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        startedAt: new Date(),
      },
    });

    // 6d. PrintJobItem — componente/perfil impresso neste job
    if (componentId) {
      await tx.printJobItem.create({
        data: {
          jobId: newJob.id,
          componentId,
          profileId: profileId ?? undefined,
          quantity: Number(quantity),
          status: "pending",
        },
      });
    }

    // 6e. PrintJobMaterial — guardar a cor REAL do spool usado,
    //     não a cor do requisito original. Assim o histórico mostra
    //     o que foi efetivamente impresso (ex: preto em vez de camel).
    for (const m of materials) {
      // Usar sempre os dados reais do spool — cor, nome e material base
      const realSpool = spoolColorMap.get(m.spoolId!);
      await tx.printJobMaterial.create({
        data: {
          jobId: newJob.id,
          slotId: m.slotId ?? null,
          spoolId: m.spoolId,
          material: realSpool?.material ?? m.material,
          colorHex: realSpool?.colorHex ?? null,
          colorName: realSpool?.colorName ?? null,
          estimatedG: m.estimatedG,
          matchScore: m.matchScore ?? 100,
        },
      });
    }

    // 6f. Impressora → "printing"
    await tx.printer.update({
      where: { id: printerId },
      data: { status: "printing" },
    });

    return { job: newJob, order: newOrder };
  });

  // 6. Feedback
  const colorOverrides = materials.filter(
    (m) => m.spoolId && (m.matchScore ?? 100) < 100,
  );

  let apiMessage = `OP ${orderReference} criada e impressão iniciada em ${printer.name}.`;
  if (colorOverrides.length > 0) {
    const list = colorOverrides.map((m) => m.material).join(", ");
    apiMessage += ` Substituição de cor em: ${list} (material-base compatível).`;
  }

  return NextResponse.json({
    jobId: job.id,
    orderId: order.id,
    orderReference,
    apiMessage,
  });
}
