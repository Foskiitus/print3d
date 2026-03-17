import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sales
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [sales, products, productionCosts] = await Promise.all([
    prisma.sale.findMany({
      where: { userId },
      include: { product: true, customer: true },
      orderBy: { date: "desc" },
    }),
    prisma.product.findMany({ where: { userId } }),
    prisma.productionLog.groupBy({
      by: ["productId"],
      where: { userId },
      _avg: { totalCost: true },
    }),
  ]);

  const costMap = Object.fromEntries(
    productionCosts.map((p) => [
      p.productId,
      (p._avg.totalCost ?? 0) /
        (products.find((pr) => pr.id === p.productId)?.unitsPerPrint ?? 1),
    ]),
  );

  return NextResponse.json(
    sales.map((s) => ({
      ...s,
      date: s.date.toISOString(),
      product: {
        ...s.product,
        createdAt: s.product.createdAt.toISOString(),
        updatedAt: s.product.updatedAt.toISOString(),
      },
      customer: s.customer
        ? { id: s.customer.id, name: s.customer.name, email: s.customer.email }
        : null,
      costPerUnit: costMap[s.productId] ?? null,
    })),
  );
}

// POST /api/sales
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { productId, quantity, salePrice, customerId, notes } =
      await req.json();

    if (!productId || !quantity || salePrice === undefined) {
      return NextResponse.json(
        { error: "Produto, quantidade e preço são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar que o produto pertence ao utilizador
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.userId !== userId) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Verificar stock disponível
    const [productionTotal, salesTotal] = await Promise.all([
      prisma.productionLog.aggregate({
        where: { userId: userId, productId },
        _sum: { quantity: true },
      }),
      prisma.sale.aggregate({
        where: { userId: userId, productId },
        _sum: { quantity: true },
      }),
    ]);

    const stock =
      (productionTotal._sum.quantity ?? 0) - (salesTotal._sum.quantity ?? 0);

    if (stock < quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponível: ${stock} unidade(s).` },
        { status: 409 },
      );
    }

    const sale = await prisma.sale.create({
      data: {
        userId: userId,
        productId,
        quantity: Number(quantity),
        salePrice: Number(salePrice),
        customerId: customerId || null,
        notes: notes || null,
        date: new Date(),
      },
      include: { product: true, customer: true },
    });

    return NextResponse.json(
      {
        ...sale,
        date: sale.date.toISOString(),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[POST /api/sales]", error);
    return NextResponse.json(
      { error: "Erro ao registar venda", details: error.message },
      { status: 500 },
    );
  }
}
