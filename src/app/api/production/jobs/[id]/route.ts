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
//                Verificar se a OP pode avançar para "assembly":
//                  — Para componentes multi-mesa: só quando TODAS as mesas
//                    do mesmo componente (mesmo componentId) estiverem done.
//                  — Depois disso, verificar se todos os componentes da OP
//                    estão done (sem jobs pending/printing).
//   → failed   : Printer.status = "idle", PrintJob.finishedAt = now
//
// Body: { status: "printing" | "done" | "failed" }

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type TargetStatus = "printing" | "done" | "failed";

const VALID_TRANSITIONS: Record<string, TargetStatus[]> = {
  pending: ["printing", "failed"],
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
      order: { select: { id: true, status: true } },
      printer: { select: { id: true, status: true } },
      items: { select: { componentId: true } },
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
      const additionalMinutes =
        targetStatus === "done" ? (job.estimatedMinutes ?? 0) : 0;

      await tx.printer.update({
        where: { id: job.printerId },
        data: {
          status: "idle",
          totalPrintTime: { increment: additionalMinutes },
        },
      });
    }

    // 3. Verificar avanço para "assembly" — só quando done/failed e há orderId
    if ((targetStatus === "done" || targetStatus === "failed") && job.orderId) {
      // ── Verificação multi-mesa ─────────────────────────────────────────────
      // Se este job pertence a um componente multi-mesa (totalPlates > 1),
      // verificar se todas as mesas deste componente já terminaram.
      // As mesas são identificadas pelo mesmo componentId + mesmo orderId.
      const componentIds = job.items.map((i) => i.componentId);

      if (job.totalPlates && job.totalPlates > 1 && componentIds.length > 0) {
        // Mesas ainda activas deste componente (excluindo o job atual)
        const pendingPlatesForComponent = await tx.printJob.count({
          where: {
            orderId: job.orderId,
            id: { not: jobId },
            status: { in: ["pending", "printing"] },
            items: {
              some: { componentId: { in: componentIds } },
            },
          },
        });

        // Se ainda há mesas por terminar, não avançar a OP
        if (pendingPlatesForComponent > 0) return;
      }

      // ── Verificação global da OP ───────────────────────────────────────────
      // Todos os jobs da OP (excluindo o atual) devem estar done/failed
      const remainingActive = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          id: { not: jobId },
          status: { in: ["pending", "printing"] },
        },
      });

      const anyDone = await tx.printJob.findFirst({
        where: { orderId: job.orderId, status: "done" },
        select: { id: true },
      });

      if (
        remainingActive === 0 &&
        (anyDone || targetStatus === "done") &&
        order.status === "in_progress"
      ) {
        await tx.productionOrder.update({
          where: { id: job.orderId },
          data: { status: "assembly" },
        });
      }
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
