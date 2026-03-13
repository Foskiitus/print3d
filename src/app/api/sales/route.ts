import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const sales = await prisma.sale.findMany({
      where: {
        ...(productId ? { productId: Number(productId) } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      // Incluímos os dados do artigo para podermos mostrar o nome na tabela do frontend
      include: { product: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Erro ao carregar vendas:", error);
    return NextResponse.json(
      { error: "Falha ao carregar o histórico de vendas" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerName, quantity, salePrice } = body;

    // 1. Validação básica de dados
    if (!productId || !quantity || quantity <= 0 || salePrice === undefined) {
      return NextResponse.json(
        { error: "Faltam campos obrigatórios (artigo, quantidade ou preço)" },
        { status: 400 },
      );
    }

    // 2. Verificar se o artigo existe e se há stock suficiente
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Artigo não encontrado" },
        { status: 404 },
      );
    }

    if (product.stockLevel < Number(quantity)) {
      return NextResponse.json(
        {
          error: `Stock insuficiente. Apenas tens ${product.stockLevel} unidades disponíveis para venda.`,
        },
        { status: 422 },
      );
    }

    // 3. Registo e Atualização (Transação Segura)
    // O Prisma garante que se a venda falhar, o stock não é descontado (e vice-versa).
    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          productId: Number(productId),
          // Se o nome do cliente vier vazio, guardamos como null (é opcional no schema)
          customerName: customerName ? customerName.trim() : null,
          quantity: Number(quantity),
          salePrice: Number(salePrice),
        },
        include: { product: true },
      }),
      prisma.product.update({
        where: { id: Number(productId) },
        data: { stockLevel: { decrement: Number(quantity) } },
      }),
    ]);

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Erro ao registar venda:", error);
    return NextResponse.json(
      { error: "Falha ao registar a venda no sistema" },
      { status: 500 },
    );
  }
}
