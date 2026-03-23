// src/app/api/print-jobs/[id]/complete/route.ts
//
// Conclui ou marca como falhado um PrintJob.
//
// Body:
//   {
//     status: "done" | "failed",
//     items: [
//       { jobItemId: string, status: "done" | "failed", failedUnits: number }
//     ],
//     actualMinutes?: number   // tempo real (para atualizar totalPrintTime da impressora)
//   }
//
// Ao concluir:
//   - Adiciona unidades ao ComponentStock dos componentes bem-sucedidos
//   - Atualiza totalPrintTime da impressora
//   - Calcula custos finais (elétrico + impressora) com rateio entre componentes
//   - Se todos os jobs de uma OP estiverem done → atualiza OP para "assembly"

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: jobId } = await params;

  const job = await prisma.printJob.findFirst({
    where: { id: jobId, userId },
    include: {
      printer: true,
      items: { include: { component: true } },
      materials: true,
    },
  });

  if (!job)
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });

  if (job.status === "done" || job.status === "cancelled")
    return NextResponse.json(
      { error: "Job já está concluído" },
      { status: 409 },
    );

  const { status, items, actualMinutes } = await req.json();

  if (!["done", "failed"].includes(status))
    return NextResponse.json(
      { error: "status deve ser 'done' ou 'failed'" },
      { status: 400 },
    );

  const minutesElapsed = actualMinutes ?? job.estimatedMinutes ?? 0;

  // ── Calcular custos finais ───────────────────────────────────────────────────
  const hoursElapsed = minutesElapsed / 60;
  const electricityCost = (job.printer.powerWatts / 1000) * hoursElapsed * 0.2; // €/kWh padrão
  const printerCost = job.printer.hourlyCost * hoursElapsed;

  // Custo de filamento = soma do estimatedG × preço/g de cada rolo
  let filamentCost = 0;
  for (const mat of job.materials) {
    if (!mat.spoolId) continue;
    const spool = await prisma.inventoryPurchase.findUnique({
      where: { id: mat.spoolId },
    });
    if (!spool) continue;
    const pricePerGram = spool.priceCents / 100 / spool.initialWeight;
    filamentCost += (mat.actualG ?? mat.estimatedG) * pricePerGram;
  }

  const totalCost = filamentCost + electricityCost + printerCost;

  // Rateio de custo entre itens (proporcional ao filamentUsed estimado)
  const totalG = job.items.reduce((acc, item) => {
    const profile = item as any;
    return acc + (profile.profile?.filamentUsed ?? 0);
  }, 0);

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar cada item
    for (const itemUpdate of items ?? []) {
      const { jobItemId, status: itemStatus, failedUnits = 0 } = itemUpdate;

      const jobItem = job.items.find((i) => i.id === jobItemId);
      if (!jobItem) continue;

      const successUnits = jobItem.quantity - failedUnits;

      await tx.printJobItem.update({
        where: { id: jobItemId },
        data: { status: itemStatus, failedUnits },
      });

      // 2. Adicionar ao stock de semiacabados se bem-sucedido
      if (itemStatus === "done" && successUnits > 0) {
        await tx.componentStock.upsert({
          where: { componentId: jobItem.componentId },
          create: { componentId: jobItem.componentId, quantity: successUnits },
          update: { quantity: { increment: successUnits } },
        });
      }
    }

    // 3. Atualizar o job com custos finais
    await tx.printJob.update({
      where: { id: jobId },
      data: {
        status,
        finishedAt: new Date(),
        filamentCost,
        electricityCost,
        printerCost,
        totalCost,
      },
    });

    // 4. Atualizar totalPrintTime da impressora
    if (minutesElapsed > 0) {
      await tx.printer.update({
        where: { id: job.printerId },
        data: {
          totalPrintTime: { increment: minutesElapsed },
          status: "idle",
        },
      });
    }

    // 5. Verificar se todos os jobs da OP estão concluídos
    if (job.orderId) {
      const pendingJobs = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          status: { in: ["pending", "printing"] },
          id: { not: jobId },
        },
      });

      if (pendingJobs === 0) {
        await tx.productionOrder.update({
          where: { id: job.orderId },
          data: { status: "assembly" },
        });
      }
    }
  });

  return NextResponse.json({
    jobId,
    status,
    costs: { filamentCost, electricityCost, printerCost, totalCost },
    minutesElapsed,
  });
}
