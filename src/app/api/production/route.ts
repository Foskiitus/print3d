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
        filamentUsages: true,
        extrasUsed: { include: { extra: true } },
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
    const printTimeHours = (product.printTimeMinutes || 0) / 60;
    const totalPrintTime = printTimeHours * Number(quantity);

    // Custo da Impressora (Horas * Custo por Hora)
    const printerCost = printer.hourlyCost * totalPrintTime;

    // Custo Eletricidade: (Watts / 1000 = kW) * Horas * Preço do kWh
    const electricityCost =
      (printer.electricityW / 1000) * totalPrintTime * ELECTRICITY_PRICE_KWH;

    // Custo Extras: Somar o preço de cada extra * quantidade usada * quantidade produzida
    let extrasCost = 0;
    for (const usage of product.extrasUsed) {
      extrasCost += usage.quantity * usage.extra.price * Number(quantity);
    }

    // ==========================================
    // PARTE B: ALGORITMO FIFO PARA O FILAMENTO
    // ==========================================
    let filamentCost = 0;
    const spoolUpdates = []; // Vamos guardar as atualizações para a transação final

    for (const usage of product.filamentUsages) {
      let remainingNeeded = usage.weight * Number(quantity);

      // Procurar rolos físicos deste material que ainda tenham filamento (do mais antigo para o mais novo)
      const availableSpools = await prisma.filamentSpool.findMany({
        where: {
          filamentTypeId: usage.filamentTypeId,
          remaining: { gt: 0 },
        },
        orderBy: { purchaseDate: "asc" },
      });

      for (const spool of availableSpools) {
        if (remainingNeeded <= 0) break; // Já reunimos filamento suficiente

        const costPerGram = spool.price / spool.spoolWeight;
        const amountToTake = Math.min(spool.remaining, remainingNeeded);

        filamentCost += amountToTake * costPerGram;
        remainingNeeded -= amountToTake;

        // Preparar a instrução para descontar no rolo
        spoolUpdates.push(
          prisma.filamentSpool.update({
            where: { id: spool.id },
            data: { remaining: spool.remaining - amountToTake },
          }),
        );
      }

      // Se o loop acabar e ainda faltar filamento, bloqueamos a produção
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
    const [log] = await prisma.$transaction([
      ...spoolUpdates, // 1. Desconta as gramas dos rolos exatos
      prisma.productionLog.create({
        // 2. Regista o custo no histórico
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
      prisma.product.update({
        // 3. Aumenta o stock da peça final
        where: { id: Number(productId) },
        data: { stockLevel: { increment: Number(quantity) } },
      }),
    ]);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Erro na produção:", error);
    return NextResponse.json(
      { error: "Falha ao processar a produção" },
      { status: 500 },
    );
  }
}
