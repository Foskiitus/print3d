// src/app/api/production/jobs/[id]/route.ts
//
// PATCH /api/production/jobs/[id]
//
// Avança o estado de um PrintJob:
//   pending  → printing  (utilizador confirma início)
//   printing → done      (impressão terminou)
//   printing → failed
//   pending  → failed
//
// Efeitos colaterais:
//   → printing : Printer.status = "printing", PrintJob.startedAt = now
//   → done     : Printer.status = "idle", PrintJob.finishedAt = now
//                Printer.totalPrintTime += estimatedMinutes
//                Atualiza OrderItem.completed com unidades deste job.
//                Verifica se a OP pode avançar para "assembly":
//                  — Todos os jobs devem estar done/failed.
//                  — A soma de unidades produzidas deve ≥ quantidade encomendada
//                    para TODOS os componentes/produtos da OP.
//   → failed   : Printer.status = "idle", PrintJob.finishedAt = now
//
// Body: { status: "printing" | "done" | "failed" }

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type TargetStatus = "printing" | "done" | "failed";

// Jobs nascem directamente como "printing" — o passo "pending → printing"
// foi eliminado. Só são válidas as transições de conclusão.
const VALID_TRANSITIONS: Record<string, TargetStatus[]> = {
  pending: ["printing", "failed"], // mantido para retrocompatibilidade
  printing: ["done", "failed"],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: jobId } = await params;
  const body = (await req.json()) as { status: TargetStatus };
  const { status: targetStatus } = body;

  if (!["printing", "done", "failed"].includes(targetStatus)) {
    return NextResponse.json(
      { error: `Status inválido: "${targetStatus}"` },
      { status: 400 },
    );
  }

  const job = await prisma.printJob.findFirst({
    where: { id: jobId, userId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  bom: { select: { componentId: true, quantity: true } },
                },
              },
            },
          },
        },
      },
      printer: { select: { id: true, status: true } },
      items: {
        select: { componentId: true, quantity: true, failedUnits: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  const order = job.order;
  if (!order) {
    return NextResponse.json(
      { error: "Ordem de produção associada não encontrada" },
      { status: 404 },
    );
  }

  const allowed = VALID_TRANSITIONS[job.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    return NextResponse.json(
      { error: `Transição inválida: "${job.status}" → "${targetStatus}"` },
      { status: 400 },
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar o job
    await tx.printJob.update({
      where: { id: jobId },
      data: {
        status: targetStatus,
        startedAt: targetStatus === "printing" ? now : undefined,
        finishedAt:
          targetStatus === "done" || targetStatus === "failed"
            ? now
            : undefined,
      },
    });

    // 2. Sincronizar impressora
    if (targetStatus === "printing") {
      await tx.printer.update({
        where: { id: job.printerId },
        data: { status: "printing" },
      });
    }

    if (targetStatus === "done" || targetStatus === "failed") {
      await tx.printer.update({
        where: { id: job.printerId },
        data: {
          status: "idle",
          totalPrintTime: {
            increment:
              targetStatus === "done" ? (job.estimatedMinutes ?? 0) : 0,
          },
        },
      });
    }

    // ── Abate de filamento apenas em jobs com SUCESSO ──────────────────────────
    // Se a impressão falhou, não sabemos quanto filamento foi realmente gasto.
    // O utilizador faz a correcção manualmente no inventário de spools.
    // Apenas jobs "done" descontam o filamento automaticamente.
    if (targetStatus === "done") {
      const mats = await tx.printJobMaterial.findMany({
        where: { jobId },
        include: {
          spool: { select: { id: true, currentWeight: true, userId: true } },
        },
      });
      for (const mat of mats) {
        if (!mat.spoolId || !mat.spool) continue;
        if (mat.spool.userId !== userId) continue;
        const grams = mat.actualG ?? mat.estimatedG;
        if (grams <= 0) continue;
        const newWeight = Math.max(0, mat.spool.currentWeight - grams);
        await tx.inventoryPurchase.update({
          where: { id: mat.spoolId },
          data: {
            currentWeight: newWeight,
            ...(newWeight === 0 && { archivedAt: new Date() }),
          },
        });
      }
    }

    // 3. Verificar avanço para "assembly" — só quando done/failed e há orderId
    if ((targetStatus === "done" || targetStatus === "failed") && job.orderId) {
      // ── 3a. Multi-mesa: esperar que todas as placas do componente acabem ──
      const componentIds = job.items.map((i) => i.componentId);
      if (job.totalPlates && job.totalPlates > 1 && componentIds.length > 0) {
        const pendingPlatesForComponent = await tx.printJob.count({
          where: {
            orderId: job.orderId,
            id: { not: jobId },
            status: { in: ["pending", "printing"] },
            items: { some: { componentId: { in: componentIds } } },
          },
        });
        if (pendingPlatesForComponent > 0) return;
      }

      // ── 3b. Verificar se ainda há jobs activos ────────────────────────────
      const remainingActive = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          id: { not: jobId },
          status: { in: ["pending", "printing"] },
        },
      });

      if (remainingActive > 0) return; // ainda há jobs a correr — não avançar

      // ── 3c. Verificar se as quantidades produzidas chegam ao encomendado ──
      //
      // Agregar todos os jobs done (incluindo o actual) por componentId.
      // Mapear componente → produto via BOM.
      // Só avançar para "assembly" se todos os produtos têm unidades suficientes.
      //
      // FIX: Era possível chegar aqui com remainingActive=0 após apenas 1 job
      // de uma OP com quantity=2, porque a verificação não contava unidades.

      const allDoneJobs = await tx.printJob.findMany({
        where: {
          orderId: job.orderId,
          status: "done",
          // incluir o job atual que acabou de ser marcado done nesta transação
        },
        include: {
          items: {
            select: { componentId: true, quantity: true, failedUnits: true },
          },
        },
      });
      // Também incluir o job actual (ainda não confirmado na query acima
      // porque a transação pode não ter committed o status)
      const currentJobItems = targetStatus === "done" ? job.items : [];

      // Construir mapa componentId → unidades produzidas com sucesso
      const producedByComponent = new Map<string, number>();
      for (const doneJob of allDoneJobs) {
        for (const item of doneJob.items) {
          const success = Math.max(0, item.quantity - item.failedUnits);
          producedByComponent.set(
            item.componentId,
            (producedByComponent.get(item.componentId) ?? 0) + success,
          );
        }
      }
      // Garantir que o job actual conta (pode ainda não estar reflectido na query)
      for (const item of currentJobItems) {
        const success = Math.max(0, item.quantity - item.failedUnits);
        producedByComponent.set(
          item.componentId,
          (producedByComponent.get(item.componentId) ?? 0) + success,
        );
      }

      // Verificar se cada OrderItem tem as suas unidades satisfeitas
      let allQuantitiesMet = true;
      for (const orderItem of order.items) {
        for (const bomEntry of orderItem.product.bom) {
          const neededComponents = bomEntry.quantity * orderItem.quantity;
          const producedComponents =
            producedByComponent.get(bomEntry.componentId) ?? 0;
          if (producedComponents < neededComponents) {
            allQuantitiesMet = false;
            break;
          }
        }
        if (!allQuantitiesMet) break;
      }

      // Se a OP não tem OrderItems (OP ad-hoc), verificar apenas se há algum job done
      const hasOrderItems = order.items.length > 0;
      const anyDone = allDoneJobs.length > 0 || targetStatus === "done";

      const canAdvance = hasOrderItems ? allQuantitiesMet : anyDone;

      if (canAdvance && order.status === "in_progress") {
        await tx.productionOrder.update({
          where: { id: job.orderId },
          data: { status: "assembly" },
        });
      }
      // Se não pode avançar: fica em "in_progress" — o utilizador precisa de
      // lançar mais jobs para cobrir a quantidade em falta.
    }
  });

  // Devolver job atualizado
  const updated = await prisma.printJob.findUnique({
    where: { id: jobId },
    include: {
      printer: { select: { id: true, name: true, status: true } },
      items: {
        include: { component: { select: { id: true, name: true } } },
      },
      order: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json(updated);
}
