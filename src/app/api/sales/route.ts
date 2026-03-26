// src/app/api/sales/route.ts

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sales
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const sales = await prisma.sale.findMany({
    where: { userId },
    include: {
      product: true,
      customer: { select: { id: true, name: true } },
      // Incluir a OP vinculada para o frontend saber se há produção pendente
      productionOrder: {
        select: { id: true, reference: true, status: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sales);
}

// POST /api/sales
//
// Comportamento:
//   1. Se houver stock disponível (ProductStock.quantity - reserved >= quantity):
//      → Cria a venda com status "ready_to_ship" e reserva as unidades
//   2. Se não houver stock suficiente:
//      → Cria a venda com status "pending"
//      → Gera automaticamente uma OP vinculada a esta venda
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const { productId, quantity, salePrice, customerId, customerName, notes } =
      await req.json();

    if (!productId || !quantity || salePrice === undefined) {
      return NextResponse.json(
        { error: "productId, quantity e salePrice são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar que o produto pertence ao utilizador
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Verificar stock disponível
    const stockRecord = await prisma.productStock.findUnique({
      where: { productId },
      select: { quantity: true, reserved: true },
    });

    const totalStock = stockRecord?.quantity ?? 0;
    const reserved = stockRecord?.reserved ?? 0;
    const available = totalStock - reserved;
    const hasStock = available >= Number(quantity);

    // ── Transação para garantir atomicidade em ambos os fluxos ───────────────
    const { sale, productionOrder } = await prisma.$transaction(async (tx) => {
      // Criar a venda
      const sale = await tx.sale.create({
        data: {
          userId,
          productId,
          quantity: Number(quantity),
          salePrice: Number(salePrice),
          customerId: customerId || null,
          customerName: customerName?.trim() || null,
          notes: notes?.trim() || null,
          date: new Date(),
          // Se há stock: ready_to_ship; se não: pending (aguarda produção)
          status: hasStock ? "ready_to_ship" : "pending",
        },
        include: {
          product: true,
          customer: { select: { id: true, name: true } },
        },
      });

      // Se há stock: reservar as unidades
      if (hasStock) {
        await tx.productStock.update({
          where: { productId },
          data: { reserved: { increment: Number(quantity) } },
        });
        return { sale, productionOrder: null };
      }

      // Se não há stock: gerar OP vinculada à venda
      const count = await tx.productionOrder.count({ where: { userId } });
      const reference = `OP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

      const productionOrder = await tx.productionOrder.create({
        data: {
          userId,
          reference,
          notes: `Gerada automaticamente para a venda #${sale.id.slice(-6).toUpperCase()}`,
          status: "pending",
          salesOrderId: sale.id, // ← vínculo com a venda
          items: {
            create: {
              productId,
              quantity: Number(quantity),
              completed: 0,
            },
          },
        },
        select: {
          id: true,
          reference: true,
          status: true,
        },
      });

      return { sale, productionOrder };
    });

    return NextResponse.json(
      {
        ...sale,
        productionOrder,
        stockInfo: {
          availableBeforeSale: available,
          hadStock: hasStock,
          message: hasStock
            ? `Stock disponível (${available} unidades). Venda marcada como "Pronta a Enviar".`
            : `Stock insuficiente (${available} disponíveis, ${quantity} pedidas). Ordem de Produção ${productionOrder?.reference} criada automaticamente.`,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[POST /api/sales]", err);
    return NextResponse.json(
      { error: "Falha ao registar venda", details: err.message },
      { status: 500 },
    );
  }
}
