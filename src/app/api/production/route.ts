import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Aqui garantimos que usamos o adapter obrigatório!

// Valor base da eletricidade (Podes no futuro mover para a BD ou .env)
const ELECTRICITY_PRICE_KWH = 0.16;

export async function GET() {
  try {
    const logs = await prisma.productionLog.findMany({
      include: { product: true, printer: true },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao carregar histórico" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, printerId, quantity } = body;

    if (!productId || !printerId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Dados de produção inválidos" },
        { status: 400 },
      );
    }

    // 1. Ir buscar a "Receita" do Produto
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: {
        filamentUsage: true, // ⬅️ CORREÇÃO 1: Singular, conforme o schema
      },
    });

    if (!product)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    // 2. Ir buscar a Impressora usada
    const printer = await prisma.printer.findUnique({
      where: { id: Number(printerId) },
    });

    if (!printer)
      return NextResponse.json(
        { error: "Impressora não encontrada" },
        { status: 404 },
      );

    // ==========================================
    // PARTE A: CÁLCULO DE CUSTOS FIXOS (Máquina e Extras)
    // ==========================================
    const printTimeHours = (product.productionTime || 0) / 60;
    const totalPrintTime = printTimeHours * Number(quantity);

    const printerCost = printer.hourlyCost * totalPrintTime;
    const electricityCost =
      (printer.powerWatts / 1000) * totalPrintTime * ELECTRICITY_PRICE_KWH;

    let extrasCost = 0;

    // ==========================================
    // PARTE B: ALGORITMO FIFO PARA O FILAMENTO
    // ==========================================
    let filamentCost = 0;
    const spoolUpdates = [];

    // ⬅️ CORREÇÃO 2: Singular no for loop também
    for (const usage of product.filamentUsage) {
      let remainingNeeded = usage.weight * Number(quantity);

      const availableSpools = await prisma.filamentSpool.findMany({
        where: {
          filamentTypeId: usage.filamentTypeId,
          remaining: { gt: 0 },
        },
        orderBy: { purchaseDate: "asc" },
      });

      for (const spool of availableSpools) {
        if (remainingNeeded <= 0) break;

        const costPerGram = spool.price / spool.spoolWeight;
        const amountToTake = Math.min(spool.remaining, remainingNeeded);

        filamentCost += amountToTake * costPerGram;
        remainingNeeded -= amountToTake;

        spoolUpdates.push(
          prisma.filamentSpool.update({
            where: { id: spool.id },
            data: { remaining: spool.remaining - amountToTake },
          }),
        );
      }

      if (remainingNeeded > 0) {
        return NextResponse.json(
          {
            error: `Stock de filamento insuficiente. Faltam ${remainingNeeded.toFixed(1)}g para completar a impressão.`,
          },
          { status: 422 },
        );
      }
    }

    const totalCost = printerCost + electricityCost + extrasCost + filamentCost;

    // ==========================================
    // PARTE C: TRANSAÇÃO SEGURA
    // ==========================================
    // ⬅️ CORREÇÃO 3: Removida a tentativa de atualizar o stockLevel extinto
    // e extração correta do Log no final do array da transação
    const transactionResults = await prisma.$transaction([
      ...spoolUpdates,
      prisma.productionLog.create({
        data: {
          productId: Number(productId),
          printerId: Number(printerId),
          quantity: Number(quantity),
          filamentCost,
          electricityCost,
          printerCost,
          extrasCost,
          totalCost,
        },
      }),
    ]);

    // O log será sempre a última operação inserida no array da transação
    const log = transactionResults[transactionResults.length - 1];

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Erro na produção:", error);
    return NextResponse.json(
      { error: "Falha ao processar a produção" },
      { status: 500 },
    );
  }
}
