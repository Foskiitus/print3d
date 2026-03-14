import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, printTimeMinutes, recommendedPrice, imageUrl } =
      body;

    if (!name) {
      return NextResponse.json(
        { error: "O nome do modelo é obrigatório." },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        // Usamos 'description' para guardar a categoria em texto, como no teu schema
        description: typeof category === "string" ? category : null,

        // Mapeamento para o campo correto: 'productionTime'
        productionTime: printTimeMinutes ? Number(printTimeMinutes) : null,

        // Preço recomendado
        recommendedPrice: Number(recommendedPrice) || 0,

        imageUrl: imageUrl || null,

        // O stockLevel foi removido daqui pois é calculado via logs
        // O productionCost foi removido pois é calculado dinamicamente [cite: 12, 13]
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar produto",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        productionLogs: { select: { quantity: true } }, // Para calcular stock dinâmico
        sales: { select: { quantity: true } }, // Para calcular stock dinâmico
        category: true,
        filamentUsage: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Mapeamos os produtos para calcular o stock real (Produções - Vendas)
    const productsWithStock = products.map((p) => {
      const totalProduced = p.productionLogs.reduce(
        (sum, log) => sum + log.quantity,
        0,
      );
      const totalSold = p.sales.reduce((sum, sale) => sum + sale.quantity, 0);

      return {
        ...p,
        stockLevel: totalProduced - totalSold, // Cálculo dinâmico
      };
    });

    return NextResponse.json(productsWithStock);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar produtos" },
      { status: 500 },
    );
  }
}
