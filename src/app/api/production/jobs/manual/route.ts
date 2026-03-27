// src/app/api/production/jobs/manual/route.ts
//
// POST /api/production/jobs/manual
//
// Registo retroativo de produção — chamado pelo ManualEntryModal quando
// o utilizador conclui uma OP sem ter usado o Planeador.
//
// Body:
//   {
//     orderId:        string
//     printerId:      string
//     minutesPrinted: number
//     unitsProduced:  number
//     assignments: [
//       { spoolId: string, actualG: number }
//     ]
//   }
//
// Efeitos:
//   1. Cria PrintJob { status: "done" } retroativo com finishedAt = now
//   2. Cria PrintJobMaterial por cada assignment (registo de consumo)
//   3. Abate filamento nas InventoryPurchase (currentWeight -= actualG)
//   4. Incrementa Printer.totalPrintTime
//   5. Avança OP para "assembly"

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const body = (await req.json()) as {
    orderId: string;
    printerId: string;
    minutesPrinted: number;
    unitsProduced: number;
    assignments: { spoolId: string; actualG: number }[];
  };

  const {
    orderId,
    printerId,
    minutesPrinted,
    unitsProduced,
    assignments = [],
  } = body;

  // ── Validação ─────────────────────────────────────────────────────────────
  if (!orderId || !printerId || !minutesPrinted || minutesPrinted <= 0) {
    return NextResponse.json(
      { error: "orderId, printerId e minutesPrinted são obrigatórios" },
      { status: 400 },
    );
  }

  // ── Verificar OP ──────────────────────────────────────────────────────────
  const order = await prisma.productionOrder.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              bom: {
                include: { component: { select: { id: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Ordem de produção não encontrada" },
      { status: 404 },
    );
  }

  // ── Verificar impressora ──────────────────────────────────────────────────
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    select: { id: true },
  });

  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  // ── Validar spools ────────────────────────────────────────────────────────
  if (assignments.length > 0) {
    const spoolIds = assignments.map((a) => a.spoolId);
    const validSpools = await prisma.inventoryPurchase.findMany({
      where: { id: { in: spoolIds }, userId },
      select: {
        id: true,
        item: { select: { material: true, colorHex: true, colorName: true } },
      },
    });
    const validIds = new Set(validSpools.map((s) => s.id));
    const invalid = spoolIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "Uma ou mais bobines não encontradas no inventário" },
        { status: 400 },
      );
    }
  }

  // ── Primeiro componente da OP (para associar ao PrintJobItem) ────────────
  const firstComponentId = order.items[0]?.product.bom[0]?.component.id ?? null;

  // ── Carregar info das bobines para os PrintJobMaterial ───────────────────
  const spoolInfo =
    assignments.length > 0
      ? await prisma.inventoryPurchase.findMany({
          where: { id: { in: assignments.map((a) => a.spoolId) } },
          select: {
            id: true,
            item: {
              select: { material: true, colorHex: true, colorName: true },
            },
          },
        })
      : [];

  const spoolMap = new Map(spoolInfo.map((s) => [s.id, s]));

  const now = new Date();

  // ── Transação atómica ─────────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // 1. Criar PrintJob retroativo
    const job = await tx.printJob.create({
      data: {
        userId,
        orderId,
        printerId,
        status: "done",
        estimatedMinutes: minutesPrinted,
        quantity: unitsProduced,
        startedAt: now,
        finishedAt: now,
        items: firstComponentId
          ? {
              create: [
                {
                  componentId: firstComponentId,
                  quantity: unitsProduced,
                },
              ],
            }
          : undefined,
      },
    });

    // 2. Criar PrintJobMaterial por assignment + abater filamento
    for (const { spoolId, actualG } of assignments) {
      if (actualG <= 0) continue;

      const spool = spoolMap.get(spoolId);

      // Registar consumo
      await tx.printJobMaterial.create({
        data: {
          jobId: job.id,
          spoolId,
          material: spool?.item.material ?? "Desconhecido",
          colorHex: spool?.item.colorHex ?? null,
          colorName: spool?.item.colorName ?? null,
          estimatedG: actualG,
          actualG,
        },
      });

      // Abater na bobine
      await tx.inventoryPurchase.update({
        where: { id: spoolId },
        data: { currentWeight: { decrement: actualG } },
      });
    }

    // 3. Atualizar contador de manutenção da impressora
    await tx.printer.update({
      where: { id: printerId },
      data: { totalPrintTime: { increment: minutesPrinted } },
    });

    // 4. Avançar OP para "assembly"
    await tx.productionOrder.update({
      where: { id: orderId },
      data: { status: "assembly" },
    });
  });

  return NextResponse.json({ success: true });
}
