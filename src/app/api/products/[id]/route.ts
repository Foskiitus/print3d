import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Procura um produto específico e calcula os custos dinâmicos
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        // No teu schema o nome é 'filamentUsage' e 'extras'
        filamentUsage: {
          include: {
            filamentType: {
              include: {
                spools: {
                  where: { remaining: { gt: 0 } }, // Apenas rolos com filamento
                },
              },
            },
          },
        },
        extras: {
          include: {
            extra: true,
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

    // --- CÁLCULO DINÂMICO DE CUSTOS ---

    // 1. Custo de Filamento (Média ponderada do que tens em stock)
    let totalFilamentCost = 0;
    product.filamentUsage.forEach((usage) => {
      const spools = usage.filamentType.spools;
      if (spools.length > 0) {
        // Preço médio por grama das bobines deste tipo de material
        const avgPricePerGram =
          spools.reduce((acc, s) => acc + s.price / s.spoolWeight, 0) /
          spools.length;
        totalFilamentCost += usage.weight * avgPricePerGram;
      }
    });

    // 2. Custo de Extras
    const totalExtrasCost = product.extras.reduce(
      (acc, item) => acc + item.extra.price * item.quantity,
      0,
    );

    // 3. Custo de Máquina (Baseado no tempo extraído do .3mf ou manual)
    // Vamos buscar o custo da primeira impressora como referência padrão
    const printers = await prisma.printer.findMany();
    const printerRef = printers[0];
    const hourlyCost = printerRef?.hourlyCost || 0;
    const electricityCostPerHour =
      ((printerRef?.electricity || 0) / 1000) * 0.16; // 0.16€/kWh estimativa

    const hours = (product.productionTime || 0) / 60;
    const machineCost = hours * (hourlyCost + electricityCostPerHour);

    // 4. Totais
    const totalProductionCost =
      totalFilamentCost + totalExtrasCost + machineCost;
    const suggestedPrice = totalProductionCost * (1 + (product.margin || 0.3));

    return NextResponse.json({
      ...product,
      calculatedCosts: {
        filament: totalFilamentCost,
        extras: totalExtrasCost,
        machine: machineCost,
        total: totalProductionCost,
        suggestedPrice: suggestedPrice,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/PATCH: Atualiza os dados básicos do produto (Preço, Margem, Nome)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, recommendedPrice, margin, productionTime, categoryId } = body;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : undefined,
        price:
          recommendedPrice !== undefined ? Number(recommendedPrice) : undefined, // Corrigido aqui
        margin: margin !== undefined ? Number(margin) : undefined,
        productionTime:
          productionTime !== undefined ? Number(productionTime) : undefined,
        categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
