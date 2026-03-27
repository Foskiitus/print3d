// src/app/api/products/[id]/extras/route.ts
//
// POST /api/products/[id]/extras
//
// Associa um Extra a um Produto (ProductExtra).
// Equivalente ao /bom mas para hardware/consumíveis.
//
// Body:  { extraId: string, quantity: number }
// Resposta: o ProductExtra criado com extra incluído

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: productId } = await params;

  // Verificar que o produto pertence ao utilizador
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 },
    );
  }

  const body = (await req.json()) as { extraId: string; quantity: number };
  const { extraId, quantity } = body;

  if (!extraId || !quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "extraId e quantity são obrigatórios" },
      { status: 400 },
    );
  }

  // Verificar que o extra pertence ao utilizador
  const extra = await prisma.extra.findFirst({
    where: { id: extraId, userId },
    select: { id: true },
  });
  if (!extra) {
    return NextResponse.json(
      { error: "Extra não encontrado" },
      { status: 404 },
    );
  }

  // Verificar se já existe (evitar duplicado)
  const existing = await prisma.productExtra.findFirst({
    where: { productId, extraId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Este extra já está associado ao produto" },
      { status: 409 },
    );
  }

  const entry = await prisma.productExtra.create({
    data: { productId, extraId, quantity },
    include: {
      extra: {
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          category: true,
        },
      },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
