import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateFIFOCost } from "@/lib/fifo";

// GET /api/production
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const logs = await prisma.productionLog.findMany({
    where: { userId: session.user.id },
    include: { product: true, printer: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(
    logs.map((l) => ({
      ...l,
      date: l.date.toISOString(),
      product: {
        ...l.product,
        createdAt: l.product.createdAt.toISOString(),
        updatedAt: l.product.updatedAt.toISOString(),
      },
    })),
  );
}

// POST /api/production
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { productId, printerId, quantity, printTime, notes } =
      await req.json();

    if (!productId || !printerId || !quantity) {
      return NextResponse.json(
        { error: "Produto, impressora e quantidade são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar que produto e impressora pertencem ao utilizador
    const [product, printer] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          filamentUsage: { include: { filamentType: true } },
          extras: { include: { extra: true } },
        },
      }),
      prisma.printer.findUnique({ where: { id: printerId } }),
    ]);

    if (!product || product.userId !== userId) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }
    if (!printer || printer.userId !== userId) {
      return NextResponse.json(
        { error: "Impressora não encontrada" },
        { status: 404 },
      );
    }

    // ── Calcular custos ──────────────────────────────────────────

    // 1. Custo do filamento via FIFO — usa sempre os valores definidos no produto
    const filamentUsages = product.filamentUsage.map((fu) => ({
      filamentTypeId: fu.filamentTypeId,
      weight: fu.weight,
    }));

    const { filamentCost, spoolConsumptions } = await calculateFIFOCost(
      userId,
      filamentUsages,
    );

    // 2. Custo dos extras
    const extrasCost = product.extras.reduce(
      (s, pe) => s + pe.extra.price * pe.quantity,
      0,
    );

    // 3. Custo da impressora e eletricidade
    const printHours = printTime
      ? printTime / 60
      : (product.productionTime ?? 0) / 60;
    const printerCost = printHours * printer.hourlyCost;

    // Buscar preço da eletricidade das settings (default 0.20€/kWh)
    const electricitySetting = await prisma.settings.findUnique({
      where: { userId_key: { userId, key: "electricityPrice" } },
    });
    const electricityPrice = electricitySetting
      ? Number(electricitySetting.value)
      : 0.2;

    const electricityCost =
      (printer.powerWatts / 1000) * printHours * electricityPrice;

    const totalCost = filamentCost + extrasCost + printerCost + electricityCost;

    // ── Registar produção e descontar filamento numa transação ──
    const log = await prisma.$transaction(async (tx) => {
      // Descontar filamento das bobines (FIFO)
      for (const consumption of spoolConsumptions) {
        await tx.filamentSpool.update({
          where: { id: consumption.spoolId },
          data: { remaining: { decrement: consumption.consumed } },
        });
      }

      // Criar registo de produção
      return tx.productionLog.create({
        data: {
          userId,
          productId,
          printerId,
          quantity,
          notes: notes || null,
          printTime: printTime || null,
          // ✅ Total de filamento calculado automaticamente pelo FIFO
          filamentUsed:
            Math.round(
              spoolConsumptions.reduce((s, c) => s + c.consumed, 0) * 10,
            ) / 10,
          filamentCost: Math.round(filamentCost * 100) / 100,
          electricityCost: Math.round(electricityCost * 100) / 100,
          printerCost: Math.round(printerCost * 100) / 100,
          extrasCost: Math.round(extrasCost * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
        },
        include: { product: true, printer: true },
      });
    });

    return NextResponse.json({
      ...log,
      date: log.date.toISOString(),
      totalCost: log.totalCost,
    });
  } catch (error: any) {
    console.error("[POST /api/production]", error);
    return NextResponse.json(
      { error: "Erro ao registar produção", details: error.message },
      { status: 500 },
    );
  }
}
