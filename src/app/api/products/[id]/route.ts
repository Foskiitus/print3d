import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      // Trazemos também os perfis de impressão para poderes mostrar na página de detalhes do artigo
      include: { printProfiles: true },
    });

    if (!product)
      return NextResponse.json(
        { error: "Artigo não encontrado" },
        { status: 404 },
      );

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao procurar artigo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        imageUrl: body.imageUrl ?? undefined,
        productionCost:
          body.productionCost !== undefined
            ? Number(body.productionCost)
            : undefined,
        recommendedPrice:
          body.recommendedPrice !== undefined
            ? Number(body.recommendedPrice)
            : undefined,
        stockLevel:
          body.stockLevel !== undefined ? Number(body.stockLevel) : undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao atualizar artigo:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar o artigo" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const productId = Number(id);

    // 1. Verificação de Segurança (Prevenir Erros de Chave Estrangeira)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { sales: true, productionLogs: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Artigo não encontrado" },
        { status: 404 },
      );
    }

    // 2. Se o artigo já tiver histórico financeiro, bloqueamos a eliminação
    if (product._count.sales > 0 || product._count.productionLogs > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível apagar este artigo porque já possui vendas ou produções registadas no histórico.",
          code: "HAS_RELATIONS",
        },
        { status: 409 }, // 409 Conflict
      );
    }

    // 3. Eliminação Segura (Apagamos primeiro os perfis associados, depois o artigo)
    await prisma.$transaction([
      prisma.printProfile.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao apagar artigo:", error);
    return NextResponse.json(
      { error: "Falha ao apagar o artigo" },
      { status: 500 },
    );
  }
}
