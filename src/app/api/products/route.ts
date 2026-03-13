import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      // Incluímos as relações importantes para o frontend ter logo a informação
      include: {
        printProfiles: true, // Traz os ficheiros .3MF associados a este artigo
        _count: {
          select: { sales: true, productionLogs: true }, // Útil para saberes se podes apagar o artigo
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    return NextResponse.json(
      { error: "Falha ao carregar os artigos" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ajustado para receber os campos comuns.
    // Se no teu schema o "productionCost" desapareceu do Product, podes remover essa linha abaixo.
    const { name, imageUrl, productionCost, recommendedPrice, stockLevel } =
      body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "O nome do artigo é obrigatório" },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl || null,
        productionCost: productionCost ? Number(productionCost) : 0,
        recommendedPrice: recommendedPrice ? Number(recommendedPrice) : 0,
        stockLevel: stockLevel ? Number(stockLevel) : 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Falha ao criar o artigo" },
      { status: 500 },
    );
  }
}
