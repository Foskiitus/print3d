// src/app/api/production/orders/[id]/route.ts

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeProductionOrder } from "@/lib/production";
import { NextResponse } from "next/server";

// PATCH /api/production/orders/[id]
//
// Usos:
//   { status, notes }             → atualização simples de estado/notas
//   { action: "complete" }        → executa a transação de conclusão completa da OP:
//                                   abate filamento, credita stock, atualiza venda vinculada
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.productionOrder.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // ── Ação: Concluir OP ────────────────────────────────────────────────────
    // Executa a transação atómica de 3 fases definida em lib/production.ts
    if (body.action === "complete") {
      // Verificar se todos os PrintJobs estão concluídos (done ou cancelled)
      // antes de permitir a conclusão da OP
      const pendingJobs = await prisma.printJob.count({
        where: {
          orderId: id,
          status: { in: ["pending", "printing"] },
        },
      });

      if (pendingJobs > 0) {
        return NextResponse.json(
          {
            error: `Não é possível concluir a OP: ainda existem ${pendingJobs} print job(s) em curso.`,
            pendingJobs,
          },
          { status: 409 },
        );
      }

      const result = await completeProductionOrder(id, userId);

      return NextResponse.json({
        success: true,
        message: `OP ${result.reference} concluída com sucesso.`,
        ...result,
      });
    }

    // ── Atualização simples de status/notes ──────────────────────────────────

    // Bloqueio 1: "done" só via action: "complete"
    if (body.status === "done") {
      return NextResponse.json(
        {
          error:
            'Para concluir uma OP usa { action: "complete" } que executa a transação completa de stock.',
        },
        { status: 400 },
      );
    }

    // Bloqueio 2: "in_progress" só via Planeador (criação de PrintJob)
    // O backend rejeita tentativas directas para manter integridade dos dados.
    if (body.status === "in_progress") {
      const hasPendingOrActiveJobs = await prisma.printJob.count({
        where: { orderId: id, status: { in: ["pending", "printing", "done"] } },
      });
      if (hasPendingOrActiveJobs === 0) {
        return NextResponse.json(
          {
            error:
              "A OP só pode avançar para 'Em Produção' através do Planeador de Mesas. " +
              "Cria um job de impressão primeiro.",
            code: "REQUIRES_PLANNER",
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.productionOrder.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/production/orders/[id]]", err);

    // Erros de negócio lançados por completeProductionOrder
    if (
      err.message === "Esta OP já foi concluída." ||
      err.message === "Não é possível concluir uma OP cancelada."
    ) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Falha ao atualizar", details: err.message },
      { status: 500 },
    );
  }
}

// DELETE /api/production/orders/[id]
//
// Apenas permite eliminar OPs em estado "draft", "pending" ou "cancelled".
// OPs concluídas (done) são preservadas no histórico — não podem ser eliminadas.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.productionOrder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }

    // Proteger histórico: OPs concluídas não podem ser eliminadas
    if (existing.status === "done") {
      return NextResponse.json(
        {
          error:
            "OPs concluídas não podem ser eliminadas — ficam preservadas no histórico de produção.",
        },
        { status: 403 },
      );
    }

    // Se a OP tinha uma venda vinculada com status "pending",
    // repor a venda para que o utilizador saiba que a produção foi cancelada
    if (existing.salesOrderId) {
      await prisma.sale.updateMany({
        where: {
          id: existing.salesOrderId,
          status: "pending",
          userId,
        },
        data: {
          status: "cancelled",
          notes: `OP ${existing.reference} cancelada pelo utilizador.`,
        },
      });
    }

    await prisma.productionOrder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/production/orders/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao eliminar", details: err.message },
      { status: 500 },
    );
  }
}
