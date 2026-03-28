// src/app/api/production/orders/[id]/route.ts

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  completeProductionOrder,
  ProductionShortfallError,
} from "@/lib/production";
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
      printJobs: {
        where: { status: "done" },
        include: {
          items: {
            select: { componentId: true, quantity: true, failedUnits: true },
          },
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // ── Ação: Concluir OP ────────────────────────────────────────────────────
    if (body.action === "complete") {
      // Validação 1: sem jobs activos
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

      // Validação 2: quantidades produzidas vs encomendadas
      // Só para OPs com OrderItems (OPs ad-hoc sem items são sempre válidas)
      if (existing.items.length > 0) {
        // Construir mapa componentId → unidades produzidas com sucesso
        const producedByComponent = new Map<string, number>();
        for (const job of existing.printJobs) {
          for (const item of job.items) {
            const success = Math.max(0, item.quantity - item.failedUnits);
            producedByComponent.set(
              item.componentId,
              (producedByComponent.get(item.componentId) ?? 0) + success,
            );
          }
        }

        const shortfalls: Array<{
          productName: string;
          ordered: number;
          produced: number;
        }> = [];

        for (const orderItem of existing.items) {
          let minProductUnits = Infinity;
          for (const bomEntry of orderItem.product.bom) {
            const neededComponents = bomEntry.quantity * orderItem.quantity;
            const producedComponents =
              producedByComponent.get(bomEntry.componentId) ?? 0;
            const units = Math.floor(producedComponents / bomEntry.quantity);
            minProductUnits = Math.min(minProductUnits, units);
          }
          // Se não há BOM, tratar como produção manual (sem componentes a validar)
          if (orderItem.product.bom.length === 0) continue;

          const produced = minProductUnits === Infinity ? 0 : minProductUnits;
          if (produced < orderItem.quantity) {
            shortfalls.push({
              productName: orderItem.product.name,
              ordered: orderItem.quantity,
              produced,
            });
          }
        }

        if (shortfalls.length > 0) {
          const detail = shortfalls
            .map(
              (s) => `${s.productName}: ${s.produced}/${s.ordered} produzidos`,
            )
            .join("; ");
          return NextResponse.json(
            {
              error: `Quantidade insuficiente para concluir a OP. ${detail}.`,
              shortfalls,
              code: "QUANTITY_SHORTFALL",
            },
            { status: 409 },
          );
        }
      }

      const result = await completeProductionOrder(id, userId);

      return NextResponse.json({
        success: true,
        message: `OP ${result.reference} concluída com sucesso.`,
        ...result,
      });
    }

    // ── Atualização simples de status/notes ──────────────────────────────────

    if (body.status === "done") {
      return NextResponse.json(
        {
          error:
            'Para concluir uma OP usa { action: "complete" } que executa a transação completa de stock.',
        },
        { status: 400 },
      );
    }

    if (body.status === "in_progress") {
      const hasPendingOrActiveJobs = await prisma.printJob.count({
        where: { orderId: id, status: { in: ["pending", "printing", "done"] } },
      });
      if (hasPendingOrActiveJobs === 0) {
        return NextResponse.json(
          {
            error:
              "A OP só pode avançar para 'Em Produção' através do Planeador de Mesas.",
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

    // Erro estruturado de shortfall lançado por completeProductionOrder
    if (err instanceof ProductionShortfallError) {
      return NextResponse.json(
        {
          error: err.message,
          shortfalls: err.shortfalls,
          code: "QUANTITY_SHORTFALL",
        },
        { status: 409 },
      );
    }

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

    if (existing.status === "done") {
      return NextResponse.json(
        {
          error:
            "OPs concluídas não podem ser eliminadas — ficam preservadas no histórico de produção.",
        },
        { status: 403 },
      );
    }

    if (existing.salesOrderId) {
      await prisma.sale.updateMany({
        where: { id: existing.salesOrderId, status: "pending", userId },
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
