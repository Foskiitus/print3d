// src/app/api/production/jobs/[id]/route.ts
//
// PATCH /api/production/jobs/[id]
// Permite cancelar um PrintJob preso em "pending" ou "printing".
// Usado para limpar jobs órfãos criados sem rolos.
//
// Body: { status: "cancelled", reason?: string }

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: jobId } = await params;

  const job = await prisma.printJob.findFirst({
    where: { id: jobId, userId },
    include: { order: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  if (job.status === "done") {
    return NextResponse.json(
      { error: "Não é possível cancelar um job já concluído." },
      { status: 409 },
    );
  }

  const { status, reason } = await req.json();

  if (status !== "cancelled") {
    return NextResponse.json(
      { error: "Apenas status 'cancelled' é permitido neste endpoint." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // 1. Cancelar o job
    await tx.printJob.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        finishedAt: new Date(),
        notes: reason ? `Cancelado: ${reason}` : "Cancelado manualmente.",
      },
    });

    // 2. Repor impressora para idle se estava ocupada com este job
    await tx.printer.updateMany({
      where: { id: job.printerId, status: { in: ["busy", "printing"] } },
      data: { status: "idle" },
    });

    // 3. Se todos os jobs da OP estão agora cancelados/done,
    //    repor OP para "pending" para que possa ser re-planeada
    if (job.orderId) {
      const activeJobs = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          status: { in: ["pending", "printing"] },
          id: { not: jobId },
        },
      });

      if (activeJobs === 0) {
        // Verificar se há algum job done (progresso real) ou se tudo foi cancelado
        const doneJobs = await tx.printJob.count({
          where: { orderId: job.orderId, status: "done" },
        });

        await tx.productionOrder.update({
          where: { id: job.orderId },
          data: {
            // Se há jobs done → assembly; se tudo cancelado → pending (para re-planear)
            status: doneJobs > 0 ? "assembly" : "pending",
          },
        });
      }
    }
  });

  return NextResponse.json({ success: true, jobId, status: "cancelled" });
}
