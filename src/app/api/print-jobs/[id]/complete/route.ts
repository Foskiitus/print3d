// src/app/api/print-jobs/[id]/complete/route.ts
//
// Conclui ou marca como falhado um PrintJob.
//
// Body:
//   {
//     status: "done" | "failed",
//     items: [
//       { jobItemId: string, status: "done" | "failed", failedUnits?: number }
//     ],
//     actualMinutes?: number,
//     materials?: [
//       { materialId: string, actualG: number }   // consumo real por linha de material
//     ]
//   }
//
// Ao concluir (status = "done"):
//   - Regista o consumo real de filamento (actualG) em cada PrintJobMaterial
//   - Adiciona unidades ao ComponentStock dos componentes bem-sucedidos
//   - Calcula custos finais (filamento + elétrico + impressora)
//   - Atualiza totalPrintTime da impressora
//   - Se todos os jobs de uma OP estiverem done → atualiza OP para "assembly"
//
// NOTA: O abate físico do peso dos rolos (InventoryPurchase.currentWeight)
// acontece apenas na conclusão da OP inteira (PATCH /production/orders/[id] com
// action:"complete"), não aqui. Isto permite corrigir consumos reais antes de fechar.

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ELECTRICITY_RATE_EUR_KWH = 0.2; // €/kWh — pode vir de Settings no futuro

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
      materials: { include: { spool: true } },
    },
  });

  if (!job)
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });

  if (job.status === "done" || job.status === "cancelled")
    return NextResponse.json(
      { error: "Job já está concluído" },
      { status: 409 },
    );

  const {
    status,
    items,
    actualMinutes,
    materials: materialsUpdate,
  } = await req.json();

  if (!["done", "failed"].includes(status))
    return NextResponse.json(
      { error: "status deve ser 'done' ou 'failed'" },
      { status: 400 },
    );

  const minutesElapsed = actualMinutes ?? job.estimatedMinutes ?? 0;
  const hoursElapsed = minutesElapsed / 60;

  // ── Calcular custos finais ───────────────────────────────────────────────────
  const electricityCost =
    (job.printer.powerWatts / 1000) * hoursElapsed * ELECTRICITY_RATE_EUR_KWH;
  const printerCost = job.printer.hourlyCost * hoursElapsed;

  // Calcular custo de filamento com base nos consumos reais (actuaG) ou estimados
  // Se o frontend enviou materialsUpdate com consumos reais, usar esses; caso contrário
  // usar os valores já guardados nos PrintJobMaterials
  const materialActualMap = new Map<string, number>(
    (materialsUpdate ?? []).map(
      (m: { materialId: string; actualG: number }) => [m.materialId, m.actualG],
    ),
  );

  let filamentCost = 0;
  const filamentBreakdown: {
    materialId: string;
    grams: number;
    cost: number;
  }[] = [];

  for (const mat of job.materials) {
    const actualG = materialActualMap.has(mat.id)
      ? materialActualMap.get(mat.id)!
      : (mat.actualG ?? mat.estimatedG);

    if (!mat.spoolId || !mat.spool) continue;

    const pricePerGram = mat.spool.priceCents / 100 / mat.spool.initialWeight;
    const cost = actualG * pricePerGram;
    filamentCost += cost;
    filamentBreakdown.push({ materialId: mat.id, grams: actualG, cost });
  }

  const totalCost = filamentCost + electricityCost + printerCost;

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar consumos reais de filamento nos PrintJobMaterials
    for (const { materialId, grams } of filamentBreakdown) {
      await tx.printJobMaterial.update({
        where: { id: materialId },
        data: { actualG: grams },
      });
    }

    // Se o frontend enviou materialsUpdate para IDs que não estão em filamentBreakdown
    // (rolos sem spool associado), guardar o actualG na mesma
    for (const [materialId, actualG] of materialActualMap.entries()) {
      if (!filamentBreakdown.find((f) => f.materialId === materialId)) {
        await tx.printJobMaterial.update({
          where: { id: materialId },
          data: { actualG },
        });
      }
    }

    // 2. Atualizar cada PrintJobItem e creditar ComponentStock
    for (const itemUpdate of items ?? []) {
      const { jobItemId, status: itemStatus, failedUnits = 0 } = itemUpdate;

      const jobItem = job.items.find((i) => i.id === jobItemId);
      if (!jobItem) continue;

      const successUnits = Math.max(0, jobItem.quantity - failedUnits);

      await tx.printJobItem.update({
        where: { id: jobItemId },
        data: { status: itemStatus, failedUnits },
      });

      // Creditar no stock de semiacabados apenas os que tiveram sucesso
      if (itemStatus === "done" && successUnits > 0) {
        await tx.componentStock.upsert({
          where: { componentId: jobItem.componentId },
          create: {
            componentId: jobItem.componentId,
            quantity: successUnits,
          },
          update: { quantity: { increment: successUnits } },
        });
      }
    }

    // 3. Atualizar o job com custos finais e estado
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

    // 4. Atualizar totalPrintTime da impressora e repor estado para idle
    if (minutesElapsed > 0) {
      await tx.printer.update({
        where: { id: job.printerId },
        data: {
          totalPrintTime: { increment: minutesElapsed },
          status: "idle",
        },
      });
    }

    // 5. Se todos os jobs da OP estiverem concluídos → avançar OP para "assembly"
    //    (assembly = peças impressas prontas, a aguardar conclusão manual da OP)
    if (job.orderId) {
      const pendingJobs = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          status: { in: ["pending", "printing"] },
          id: { not: jobId }, // excluir este job que acabou de ser atualizado
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
    costs: {
      filament: filamentCost,
      electricity: electricityCost,
      printer: printerCost,
      total: totalCost,
    },
    minutesElapsed,
    // Indicação ao frontend de que a OP pode estar pronta para ser concluída
    message:
      status === "done"
        ? "Job concluído. Verifica se todos os jobs da OP estão prontos para concluir a Ordem de Produção (PATCH /production/orders/[id] com action:'complete')."
        : "Job marcado como falhado.",
  });
}
