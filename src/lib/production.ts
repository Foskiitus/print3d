// src/lib/production.ts
//
// Lógica partilhada de produção — usada pelo route de conclusão de OP
// e potencialmente por outros contextos (ex: webhooks, cron).
//
// completeProductionOrder:
//   Transação atómica que executa as 3 fases de conclusão de OP:
//   1. Abate de filamento (InventoryPurchase.currentWeight) e extras (Extra.quantity)
//   2. Crédito de unidades no stock de produto acabado (ProductStock)
//   3. Se a OP tiver salesOrderId: marca a venda como "ready_to_ship" e reserva unidades
//
// Correções vs versão anterior:
//   - Extras e ProductStock usam unidades REALMENTE produzidas (via PrintJobItems.failedUnits),
//     não o quantity planeado do OrderItem.
//   - A divisão pelo bomQty garante conversão correcta componente → produto.
//   - stockAfter é lido APÓS o upsert (não antes), devolvendo o valor real.
//   - Extra.quantity não desce abaixo de zero.

import { prisma } from "@/lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CompleteOrderResult {
  orderId: string;
  reference: string;
  itemsCompleted: {
    productId: string;
    productName: string;
    quantityProduced: number;
    stockAfter: number;
  }[];
  filamentDeducted: { spoolId: string; gramsDeducted: number }[];
  extrasDeducted: { extraId: string; name: string; quantityDeducted: number }[];
  salesOrder?: {
    saleId: string;
    status: "ready_to_ship";
    unitsReserved: number;
  };
  costs: {
    filament: number;
    electricity: number;
    printer: number;
    total: number;
  };
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function completeProductionOrder(
  orderId: string,
  userId: string,
): Promise<CompleteOrderResult> {
  const order = await prisma.productionOrder.findFirst({
    where: { id: orderId, userId },
    include: {
      salesOrder: true,
      items: {
        include: {
          product: {
            include: {
              bom: {
                include: {
                  component: {
                    include: {
                      profiles: {
                        include: { filaments: true },
                        orderBy: { createdAt: "asc" },
                        take: 1,
                      },
                    },
                  },
                },
              },
              extras: { include: { extra: true } },
            },
          },
        },
      },
      printJobs: {
        where: { status: "done" },
        include: {
          materials: { include: { spool: true } },
          items: true, // PrintJobItems: quantity + failedUnits
        },
      },
    },
  });

  if (!order) throw new Error("Ordem de Produção não encontrada.");
  if (order.status === "done") throw new Error("Esta OP já foi concluída.");
  if (order.status === "cancelled")
    throw new Error("Não é possível concluir uma OP cancelada.");

  // ── 1. Abates de filamento ────────────────────────────────────────────────
  // Agrupa consumo real (actualG ?? estimatedG) por spool de todos os jobs done.
  const spoolConsumption = new Map<string, number>();
  let totalFilamentCost = 0;
  let totalElectricityCost = 0;
  let totalPrinterCost = 0;

  for (const job of order.printJobs) {
    totalFilamentCost += job.filamentCost ?? 0;
    totalElectricityCost += job.electricityCost ?? 0;
    totalPrinterCost += job.printerCost ?? 0;

    for (const mat of job.materials) {
      if (!mat.spoolId) continue;
      const grams = mat.actualG ?? mat.estimatedG;
      spoolConsumption.set(
        mat.spoolId,
        (spoolConsumption.get(mat.spoolId) ?? 0) + grams,
      );
    }
  }

  // ── 2. Unidades realmente produzidas por produto ──────────────────────────
  //
  // Fonte de verdade: PrintJobItems (status done).
  //   successUnits = jobItem.quantity - jobItem.failedUnits
  //
  // Um PrintJobItem referencia um Component, não um Product.
  // Mapeamos via BOM: para cada componente, que produtos desta OP o usam e
  // em que quantidade (bomQty). Assim:
  //   produtos produzidos = floor(successUnitsComponente / bomQty)
  //
  // Se não houver jobs registados (ex: produção externa), usa quantity planeado.

  // Mapa: componentId → lista de { productId, bomQty } para esta OP
  const componentToProducts = new Map<
    string,
    { productId: string; bomQty: number }[]
  >();
  for (const orderItem of order.items) {
    for (const bomEntry of orderItem.product.bom) {
      const list = componentToProducts.get(bomEntry.componentId) ?? [];
      list.push({ productId: orderItem.productId, bomQty: bomEntry.quantity });
      componentToProducts.set(bomEntry.componentId, list);
    }
  }

  // Acumular sucessos por productId
  const successUnitsByProduct = new Map<string, number>();
  for (const job of order.printJobs) {
    for (const jobItem of job.items) {
      const successUnits = Math.max(0, jobItem.quantity - jobItem.failedUnits);
      if (successUnits <= 0) continue;

      const productEntries = componentToProducts.get(jobItem.componentId);
      if (!productEntries) continue;

      for (const { productId, bomQty } of productEntries) {
        // Converter unidades de componente em unidades de produto acabado
        const productUnits = Math.floor(successUnits / bomQty);
        successUnitsByProduct.set(
          productId,
          (successUnitsByProduct.get(productId) ?? 0) + productUnits,
        );
      }
    }
  }

  // ── 3. Abates de extras ───────────────────────────────────────────────────
  // Usa unidades reais; fallback ao planeado se não houver jobs registados.
  const extrasConsumption = new Map<
    string,
    { name: string; quantity: number }
  >();
  for (const orderItem of order.items) {
    const unitsProduced =
      successUnitsByProduct.get(orderItem.productId) ?? orderItem.quantity;

    for (const pe of orderItem.product.extras) {
      const qty = pe.quantity * unitsProduced;
      if (qty <= 0) continue;
      const existing = extrasConsumption.get(pe.extraId);
      extrasConsumption.set(pe.extraId, {
        name: pe.extra.name,
        quantity: (existing?.quantity ?? 0) + qty,
      });
    }
  }

  // ─── Transação atómica ────────────────────────────────────────────────────

  const result = await prisma.$transaction(async (tx) => {
    const filamentDeducted: CompleteOrderResult["filamentDeducted"] = [];
    const extrasDeducted: CompleteOrderResult["extrasDeducted"] = [];
    const itemsCompleted: CompleteOrderResult["itemsCompleted"] = [];

    // ── FASE 1A: Abater filamento ────────────────────────────────────────────
    for (const [spoolId, grams] of spoolConsumption.entries()) {
      const spool = await tx.inventoryPurchase.findUnique({
        where: { id: spoolId },
        select: { currentWeight: true, userId: true },
      });
      // Nunca abater rolo de outro utilizador
      if (!spool || spool.userId !== userId) continue;

      const newWeight = Math.max(0, spool.currentWeight - grams);
      await tx.inventoryPurchase.update({
        where: { id: spoolId },
        data: {
          currentWeight: newWeight,
          ...(newWeight === 0 && { archivedAt: new Date() }),
        },
      });
      filamentDeducted.push({ spoolId, gramsDeducted: grams });
    }

    // ── FASE 1B: Abater extras/hardware ─────────────────────────────────────
    for (const [extraId, { name, quantity }] of extrasConsumption.entries()) {
      const extra = await tx.extra.findFirst({
        where: { id: extraId, userId },
        select: { quantity: true },
      });
      if (!extra) continue;

      // Não deixar descer abaixo de zero — stock negativo é inválido
      const newQty = Math.max(0, extra.quantity - quantity);
      await tx.extra.update({
        where: { id: extraId },
        data: { quantity: newQty },
      });
      extrasDeducted.push({ extraId, name, quantityDeducted: quantity });
    }

    // ── FASE 2: Creditar ProductStock ────────────────────────────────────────
    for (const orderItem of order.items) {
      const unitsProduced =
        successUnitsByProduct.get(orderItem.productId) ?? orderItem.quantity;

      await tx.productStock.upsert({
        where: { productId: orderItem.productId },
        create: {
          userId,
          productId: orderItem.productId,
          quantity: unitsProduced,
          reserved: 0,
        },
        update: { quantity: { increment: unitsProduced } },
      });

      // Ler APÓS o upsert para devolver o valor correcto
      const stockAfterRecord = await tx.productStock.findUnique({
        where: { productId: orderItem.productId },
        select: { quantity: true },
      });

      // Gravar unidades reais no OrderItem
      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { completed: unitsProduced },
      });

      itemsCompleted.push({
        productId: orderItem.productId,
        productName: orderItem.product.name,
        quantityProduced: unitsProduced,
        stockAfter: stockAfterRecord?.quantity ?? unitsProduced,
      });
    }

    // ── FASE 3: Atualizar venda vinculada ────────────────────────────────────
    let salesOrderResult: CompleteOrderResult["salesOrder"] | undefined;

    if (order.salesOrderId && order.salesOrder) {
      const sale = order.salesOrder;
      const productId = sale.productId;

      // Ler stock após Fase 2 (valores já actualizados nesta transação)
      const stockRecord = await tx.productStock.findUnique({
        where: { productId },
        select: { quantity: true, reserved: true },
      });

      const available =
        (stockRecord?.quantity ?? 0) - (stockRecord?.reserved ?? 0);
      const unitsToReserve = Math.min(sale.quantity, available);

      if (unitsToReserve > 0) {
        await tx.productStock.update({
          where: { productId },
          data: { reserved: { increment: unitsToReserve } },
        });
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: "ready_to_ship" },
        });
        salesOrderResult = {
          saleId: sale.id,
          status: "ready_to_ship",
          unitsReserved: unitsToReserve,
        };
      }
    }

    // ── Marcar OP como done ──────────────────────────────────────────────────
    await tx.productionOrder.update({
      where: { id: orderId },
      data: { status: "done" },
    });

    return {
      filamentDeducted,
      extrasDeducted,
      itemsCompleted,
      salesOrderResult,
    };
  });

  return {
    orderId,
    reference: order.reference,
    ...result,
    costs: {
      filament: totalFilamentCost,
      electricity: totalElectricityCost,
      printer: totalPrinterCost,
      total: totalFilamentCost + totalElectricityCost + totalPrinterCost,
    },
  };
}
