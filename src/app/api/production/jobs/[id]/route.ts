// src/app/api/production/jobs/[id]/route.ts
//
// PATCH /api/production/jobs/[id]
//
// Avança o estado de um PrintJob:
//
//   pending  ──► printing   (utilizador confirma início físico)
//   printing ──► done       (impressão terminou com sucesso)
//   printing ──► failed     (impressão falhou)
//   pending  ──► failed     (job cancelado antes de começar)
//
// Efeitos colaterais:
//
//   → printing:
//       • Printer.status = "printing"
//       • PrintJob.startedAt = now()
//
//   → done:
//       • Printer.status = "idle"
//       • PrintJob.finishedAt = now()
//       • Printer.totalPrintTime += estimatedMinutes
//       • Se todos os jobs da OP estão done/failed → OP avança para "assembly"
//
//   → failed:
//       • Printer.status = "idle"
//       • PrintJob.finishedAt = now()
//
// Body:  { status: "printing" | "done" | "failed" }

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

  // ── Validação do payload ──────────────────────────────────────────────────
  if (!["printing", "done", "failed"].includes(targetStatus)) {
    return NextResponse.json(
      { error: `Status inválido: "${targetStatus}"` },
      { status: 400 },
    );
  }

  // ── Carregar o job ────────────────────────────────────────────────────────
  const job = await prisma.printJob.findFirst({
    where: { id: jobId, userId },
    include: {
      order: {
        select: { id: true, status: true },
      },
      printer: {
        select: { id: true, status: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  // ── Validar transição ─────────────────────────────────────────────────────
  const allowed = VALID_TRANSITIONS[job.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    return NextResponse.json(
      { error: `Transição inválida: "${job.status}" → "${targetStatus}"` },
      { status: 400 },
    );
  }

  const now = new Date();

  // ── Transição em transação atómica ───────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // 1. Atualizar o job
    await tx.printJob.update({
      where: { id: jobId },
      data: {
        status: targetStatus,
        startedAt: targetStatus === "printing" ? now : undefined,
        // schema usa finishedAt (não completedAt)
        finishedAt:
          targetStatus === "done" || targetStatus === "failed"
            ? now
            : undefined,
      },
    });

    // 2. Sincronizar status da impressora
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

    // 3. Verificar se a OP pode avançar para "assembly"
    //    Condição: todos os jobs da OP estão done ou failed (nenhum pending/printing)
    //    e pelo menos um ficou done.
    if ((targetStatus === "done" || targetStatus === "failed") && job.orderId) {
      const remainingActive = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          id: { not: jobId },
          status: { in: ["pending", "printing"] },
        },
      });

      const anyDone = await tx.printJob.findFirst({
        where: {
          orderId: job.orderId,
          status: "done",
        },
        select: { id: true },
      });

      const orderStatus = job.order?.status;

      if (
        remainingActive === 0 &&
        (anyDone || targetStatus === "done") &&
        orderStatus === "in_progress"
      ) {
        await tx.productionOrder.update({
          where: { id: job.orderId },
          data: { status: "assembly" },
        });
      }
    }
  });

  // ── Devolver job atualizado ───────────────────────────────────────────────
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
