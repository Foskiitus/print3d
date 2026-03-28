// src/app/api/sales/route.ts  (apenas o POST — mantém o GET existente)
//
// Fluxo ao criar uma venda:
//   1. Verificar stock disponível (ProductStock.quantity - reserved)
//   2a. Stock suficiente → reservar unidades, status = "ready_to_ship"
//   2b. Stock insuficiente → status = "pending", sugerir OP
//       Se o cliente confirmar (generateOp=true), criar OP vinculada
//       com quantidade = 1 placa completa (batchSize do perfil)

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));

  const {
    productId,
    quantity,
    salePrice,
    customerId,
    customerName,
    notes,
    generateOp = false, // true = utilizador confirmou a criação da OP
    forceCreate = false, // true = criar mesmo com shortage (sem OP)
  }: {
    productId: string;
    quantity: number;
    salePrice: number;
    customerId?: string | null;
    customerName?: string | null;
    notes?: string | null;
    generateOp?: boolean;
    forceCreate?: boolean;
  } = body;

  if (!productId || !quantity || !salePrice) {
    return NextResponse.json(
      { error: "Campos obrigatórios em falta" },
      { status: 400 },
    );
  }

  // 1. Verificar que o produto pertence ao utilizador
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    include: {
      stock: true,
      bom: {
        include: {
          component: {
            include: {
              profiles: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 },
    );
  }

  // 2. Calcular stock real disponível (quantidade - reservado)
  const stockQty = product.stock?.quantity ?? 0;
  const reserved = product.stock?.reserved ?? 0;
  const available = Math.max(0, stockQty - reserved);
  const shortage = Math.max(0, quantity - available);

  // 3. Se há falta de stock e o cliente ainda não confirmou a OP nem forçou criação
  if (shortage > 0 && !generateOp && !forceCreate) {
    // Calcular batchSize recomendado (tamanho de 1 placa completa)
    const batchSize = product.bom[0]?.component?.profiles[0]?.batchSize ?? 1;
    const platesNeeded = Math.ceil(shortage / batchSize);
    const suggestedQty = platesNeeded * batchSize;

    return NextResponse.json(
      {
        stockInsufficient: true,
        available,
        shortage,
        suggestedOpQty: suggestedQty, // quantidade sugerida para a OP (lotes completos)
        batchSize,
        message: `Stock insuficiente: tens ${available} unidades, precisas de ${quantity}. Faltam ${shortage}.`,
      },
      { status: 409 },
    );
  }

  // 4. Criar a venda numa transação
  const result = await prisma.$transaction(async (tx) => {
    // 4a. Criar a venda
    const sale = await tx.sale.create({
      data: {
        userId,
        productId,
        quantity,
        salePrice,
        notes: notes ?? null,
        customerId: customerId ?? null,
        customerName: customerName ?? null,
        status: shortage > 0 ? "pending" : "ready_to_ship",
      },
      include: { product: true, customer: true },
    });

    // 4b. Reservar stock (só se há stock suficiente)
    if (shortage === 0 && product.stock) {
      await tx.productStock.update({
        where: { productId },
        data: { reserved: { increment: quantity } },
      });
    }

    // 4c. Criar OP vinculada se há falta E o utilizador confirmou
    let productionOrder = null;
    if (shortage > 0 && generateOp) {
      const batchSize = product.bom[0]?.component?.profiles[0]?.batchSize ?? 1;
      const platesNeeded = Math.ceil(shortage / batchSize);
      const opQty = platesNeeded * batchSize;

      const count = await tx.productionOrder.count({ where: { userId } });
      const reference = `OP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

      productionOrder = await tx.productionOrder.create({
        data: {
          userId,
          reference,
          status: "pending",
          salesOrderId: sale.id,
          notes: `Urgente — Encomenda ${sale.id.slice(-6).toUpperCase()} · ${product.name} · ${quantity} un. para cliente${sale.customerName ? ` ${sale.customerName}` : ""}.`,
          items: {
            create: [
              {
                productId,
                quantity: opQty,
                completed: 0,
              },
            ],
          },
        },
      });

      // Atualizar a venda para "pending" com referência implícita à OP
      // (a ligação já existe via salesOrderId na OP)
    }

    return { sale, productionOrder };
  });

  return NextResponse.json(
    {
      sale: result.sale,
      productionOrder: result.productionOrder,
      status: result.sale.status,
    },
    { status: 201 },
  );
}
