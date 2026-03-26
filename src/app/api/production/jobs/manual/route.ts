// src/app/api/production/jobs/manual/route.ts
//
// POST /api/production/jobs/manual
//
// Cria um PrintJob retroativo com dados inseridos manualmente.
// Suporta múltiplas bobines (uma por requisito de material da BOM).
//
// Body:
//   {
//     orderId:        string,
//     printerId:      string,
//     minutesPrinted: number,
//     unitsProduced:  number,
//     assignments: [{ spoolId: string, actualG: number }]
//   }
//
// Transação única:
//   1. PrintJob (done) + PrintJobMaterials (uma por bobine) + PrintJobItems (BOM)
//   2. Decrementa currentWeight de cada bobine
//   3. Incrementa Printer.totalPrintTime
//   4. Atualiza OrderItem.completed
//   5. Avança OP para "assembly"

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ELECTRICITY_RATE = 0.2;

export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const body = await req.json();
  const { orderId, printerId, minutesPrinted, unitsProduced, assignments } =
    body as {
      orderId: string;
      printerId: string;
      minutesPrinted: number;
      unitsProduced: number;
      assignments: { spoolId: string; actualG: number }[];
    };

  if (!orderId || !printerId || !minutesPrinted || !unitsProduced) {
    return NextResponse.json(
      {
        error:
          "orderId, printerId, minutesPrinted e unitsProduced são obrigatórios.",
      },
      { status: 400 },
    );
  }
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return NextResponse.json(
      { error: "assignments deve conter pelo menos uma bobine." },
      { status: 400 },
    );
  }
  if (assignments.some((a) => !a.spoolId || a.actualG <= 0)) {
    return NextResponse.json(
      { error: "Cada assignment deve ter spoolId e actualG > 0." },
      { status: 400 },
    );
  }

  const order = await prisma.productionOrder.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: { include: { bom: true } } } } },
  });
  if (!order) {
    return NextResponse.json({ error: "OP não encontrada." }, { status: 404 });
  }
  if (order.status === "done" || order.status === "cancelled") {
    return NextResponse.json(
      {
        error:
          "Não é possível registar consumo numa OP já concluída ou cancelada.",
      },
      { status: 409 },
    );
  }

  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
  });
  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada." },
      { status: 404 },
    );
  }

  const spoolIds = assignments.map((a) => a.spoolId);
  const spools = await prisma.inventoryPurchase.findMany({
    where: { id: { in: spoolIds }, userId, archivedAt: null },
    include: { item: true },
  });
  if (spools.length !== new Set(spoolIds).size) {
    return NextResponse.json(
      { error: "Uma ou mais bobines não foram encontradas." },
      { status: 404 },
    );
  }
  const spoolMap = new Map(spools.map((s) => [s.id, s]));

  // Calcular custos
  const hours = minutesPrinted / 60;
  const electricityCost =
    (printer.powerWatts / 1000) * hours * ELECTRICITY_RATE;
  const printerCost = printer.hourlyCost * hours;
  const filamentCost = assignments.reduce((sum, a) => {
    const s = spoolMap.get(a.spoolId)!;
    return sum + a.actualG * (s.priceCents / 100 / s.initialWeight);
  }, 0);
  const totalCost = filamentCost + electricityCost + printerCost;
  const totalPlanned = order.items.reduce((s, i) => s + i.quantity, 0);

  const result = await prisma.$transaction(async (tx) => {
    // 1. PrintJob retroativo
    const job = await tx.printJob.create({
      data: {
        userId,
        orderId,
        printerId,
        status: "done",
        quantity: unitsProduced,
        estimatedMinutes: minutesPrinted,
        filamentCost,
        electricityCost,
        printerCost,
        totalCost,
        startedAt: new Date(),
        finishedAt: new Date(),
        notes: "Registo manual de consumo",
        items: {
          create: order.items.flatMap((oi) =>
            oi.product.bom.map((b) => ({
              componentId: b.componentId,
              quantity: Math.round(
                (unitsProduced / totalPlanned) * oi.quantity * b.quantity,
              ),
              status: "done",
              failedUnits: 0,
            })),
          ),
        },
        materials: {
          create: assignments.map((a) => {
            const s = spoolMap.get(a.spoolId)!;
            return {
              spoolId: a.spoolId,
              material: s.item.material,
              colorHex: s.item.colorHex,
              colorName: s.item.colorName,
              estimatedG: a.actualG,
              actualG: a.actualG,
            };
          }),
        },
      },
    });

    // 2. Abater filamento
    const spoolResults: { id: string; newWeight: number }[] = [];
    for (const a of assignments) {
      const s = spoolMap.get(a.spoolId)!;
      const newWeight = Math.max(0, s.currentWeight - a.actualG);
      await tx.inventoryPurchase.update({
        where: { id: a.spoolId },
        data: {
          currentWeight: newWeight,
          ...(newWeight === 0 && { archivedAt: new Date() }),
        },
      });
      spoolResults.push({ id: a.spoolId, newWeight });
    }

    // 3. Horas de impressora
    await tx.printer.update({
      where: { id: printerId },
      data: { totalPrintTime: { increment: minutesPrinted }, status: "idle" },
    });

    // 4. OrderItem.completed
    for (const oi of order.items) {
      const completed = Math.min(
        oi.quantity,
        Math.round((unitsProduced / totalPlanned) * oi.quantity),
      );
      await tx.orderItem.update({ where: { id: oi.id }, data: { completed } });
    }

    // 5. OP → assembly
    await tx.productionOrder.update({
      where: { id: orderId },
      data: { status: "assembly" },
    });

    return { job, spoolResults };
  });

  return NextResponse.json(
    {
      jobId: result.job.id,
      costs: { filamentCost, electricityCost, printerCost, totalCost },
      spoolResults: result.spoolResults,
      printerMinutesAdded: minutesPrinted,
      unitsProduced,
      message: "Job retroativo criado. OP em 'Montagem' — a concluir...",
    },
    { status: 201 },
  );
}
