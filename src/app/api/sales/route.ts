import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sales
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const sales = await prisma.sale.findMany({
    where: { userId },
    include: {
      product: true,
      customer: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sales);
}

// POST /api/sales
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const { productId, quantity, salePrice, customerId, customerName, notes } =
      await req.json();

    if (!productId || !quantity || salePrice === undefined) {
      return NextResponse.json(
        { error: "productId, quantity e salePrice são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar que o produto pertence ao utilizador
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const sale = await prisma.sale.create({
      data: {
        userId,
        productId,
        quantity: Number(quantity),
        salePrice: Number(salePrice),
        customerId: customerId || null,
        customerName: customerName?.trim() || null,
        notes: notes?.trim() || null,
        date: new Date(),
      },
      include: {
        product: true,
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/sales]", err);
    return NextResponse.json(
      { error: "Falha ao registar venda", details: err.message },
      { status: 500 },
    );
  }
}
