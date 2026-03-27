// src/app/api/sales/[id]/route.ts

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── Transições de status permitidas ─────────────────────────────────────────
//
// pending        → ready_to_ship | cancelled
// ready_to_ship  → shipped | cancelled
// shipped        → fulfilled | cancelled
// fulfilled      → (terminal — sem transições)
// cancelled      → (terminal — sem transições)
//
// Efeitos colaterais por transição:
//   → cancelled (de ready_to_ship ou shipped):
//       • ProductStock.reserved -= sale.quantity  (liberta a reserva)
//   → fulfilled (de shipped):
//       • ProductStock.reserved -= sale.quantity  (a reserva passou a venda real)
//       • ProductStock.quantity -= sale.quantity  (deduz do stock disponível)

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["ready_to_ship", "cancelled"],
  ready_to_ship: ["shipped", "cancelled"],
  shipped: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

// PATCH /api/sales/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.sale.findFirst({
      where: { id, userId },
      include: { product: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { quantity, salePrice, customerId, customerName, notes, status } =
      body;

    // ── Transição de status ──────────────────────────────────────────────────
    if (status !== undefined && status !== existing.status) {
      const currentStatus = existing.status ?? "fulfilled";
      const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            error: `Transição inválida: "${currentStatus}" → "${status}"`,
            allowedTransitions: allowed,
          },
          { status: 400 },
        );
      }

      // Executar transição + efeitos colaterais em transação atómica
      const updated = await prisma.$transaction(async (tx) => {
        // Efeito 1: cancelamento — libertar unidades reservadas no ProductStock
        if (
          status === "cancelled" &&
          ["ready_to_ship", "shipped"].includes(currentStatus)
        ) {
          await tx.productStock.updateMany({
            where: { productId: existing.productId, userId },
            data: {
              reserved: { decrement: existing.quantity },
            },
          });
          // Garantir que reserved nunca fica negativo
          await tx.productStock.updateMany({
            where: {
              productId: existing.productId,
              userId,
              reserved: { lt: 0 },
            },
            data: { reserved: 0 },
          });
        }

        // Efeito 2: fulfilled — a venda foi concluída
        // A reserva é consumida e deduzida do stock físico disponível
        if (status === "fulfilled" && currentStatus === "shipped") {
          await tx.productStock.updateMany({
            where: { productId: existing.productId, userId },
            data: {
              reserved: { decrement: existing.quantity },
              quantity: { decrement: existing.quantity },
            },
          });
          // Garantir que quantity e reserved não ficam negativos
          const stock = await tx.productStock.findFirst({
            where: { productId: existing.productId, userId },
            select: { quantity: true, reserved: true },
          });
          if (stock) {
            const fixQuantity = Math.max(0, stock.quantity);
            const fixReserved = Math.max(0, stock.reserved);
            if (
              fixQuantity !== stock.quantity ||
              fixReserved !== stock.reserved
            ) {
              await tx.productStock.updateMany({
                where: { productId: existing.productId, userId },
                data: { quantity: fixQuantity, reserved: fixReserved },
              });
            }
          }
        }

        // Atualizar o status da venda
        return tx.sale.update({
          where: { id },
          data: { status },
          include: {
            product: true,
            customer: { select: { id: true, name: true } },
          },
        });
      });

      return NextResponse.json(updated);
    }

    // ── Atualização de campos (sem mudança de status) ─────────────────────────
    const updated = await prisma.sale.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(salePrice !== undefined && { salePrice: Number(salePrice) }),
        ...(customerId !== undefined && {
          customerId: customerId === "none" ? null : customerId || null,
        }),
        ...(customerName !== undefined && {
          customerName: customerName?.trim() || null,
        }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
      include: {
        product: true,
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/sales/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao atualizar", details: err.message },
      { status: 500 },
    );
  }
}

// DELETE /api/sales/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.sale.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 },
      );
    }

    // Se a venda tinha reserva activa, libertar antes de eliminar
    if (
      existing.status &&
      ["ready_to_ship", "shipped"].includes(existing.status)
    ) {
      await prisma.productStock.updateMany({
        where: { productId: existing.productId, userId },
        data: { reserved: { decrement: existing.quantity } },
      });
    }

    await prisma.sale.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/sales/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao eliminar", details: err.message },
      { status: 500 },
    );
  }
}
