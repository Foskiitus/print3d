import { NextRequest, NextResponse } from "next/server";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/print-jobs/[id]/complete
// Conclui ou cancela um PrintJob e repõe o status da impressora para "idle"
// se não houver outros jobs ativos na mesma impressora.
//
// Body: { status: "done" | "failed" | "cancelled" }

export async function POST(req: NextRequest, { params }: Params) {
  const userId = await requirePageAuth();
  const { id: jobId } = await params;

  const body = await req.json().catch(() => ({}));
  const outcome: string = body.status ?? "done";

  if (!["done", "failed", "cancelled"].includes(outcome)) {
    return NextResponse.json(
      { error: "Status inválido. Use: done, failed ou cancelled" },
      { status: 400 },
    );
  }

  // Verificar que o job pertence ao utilizador
  const job = await prisma.printJob.findFirst({
    where: { id: jobId, userId },
    select: {
      id: true,
      printerId: true,
      orderId: true,
      status: true,
      quantity: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  if (!["pending", "printing"].includes(job.status)) {
    return NextResponse.json(
      {
        error: `Job já está em estado "${job.status}" — não pode ser alterado`,
      },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar o job
    await tx.printJob.update({
      where: { id: jobId },
      data: {
        status: outcome,
        finishedAt: new Date(),
      },
    });

    // 2. Verificar se há outros jobs ativos na mesma impressora
    const otherActiveJobs = await tx.printJob.count({
      where: {
        printerId: job.printerId,
        status: { in: ["printing", "pending"] },
        id: { not: jobId },
      },
    });

    // 3. Se não há outros jobs ativos → impressora volta a "idle"
    if (otherActiveJobs === 0) {
      await tx.printer.update({
        where: { id: job.printerId },
        data: { status: "idle" },
      });
    }

    // 4. Se a OP está "in_progress" e não há mais jobs ativos nela,
    //    avançar automaticamente para "assembly" para aparecer no fluxo
    if (job.orderId && outcome === "done") {
      const remainingActiveJobs = await tx.printJob.count({
        where: {
          orderId: job.orderId,
          status: { in: ["printing", "pending"] },
          id: { not: jobId },
        },
      });

      if (remainingActiveJobs === 0) {
        const order = await tx.productionOrder.findUnique({
          where: { id: job.orderId },
          select: { status: true },
        });
        if (order?.status === "in_progress") {
          await tx.productionOrder.update({
            where: { id: job.orderId },
            data: { status: "assembly" },
          });
        }
      }
    }
  });

  return NextResponse.json({ success: true, jobId, outcome });
}
