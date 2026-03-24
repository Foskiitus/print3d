// src/app/api/products/[id]/bom/[bomId]/route.ts

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string; bomId: string }>;
}

// ── PATCH /api/products/[id]/bom/[bomId] — atualizar quantidade ───────────────
export async function PATCH(req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: productId, bomId } = await params;

  try {
    const { quantity } = await req.json();

    if (typeof quantity !== "number" || quantity < 1)
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 },
      );

    // Verificar que o produto pertence ao utilizador
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    // Verificar que a entrada BOM pertence ao produto
    const existing = await prisma.productBOM.findFirst({
      where: { id: bomId, productId },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Entrada BOM não encontrada" },
        { status: 404 },
      );

    const updated = await prisma.productBOM.update({
      where: { id: bomId },
      data: { quantity },
      include: {
        component: {
          include: {
            profiles: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { filaments: true },
            },
            stock: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH /api/products/[id]/bom/[bomId]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar BOM", details: error.message },
      { status: 500 },
    );
  }
}

// ── DELETE /api/products/[id]/bom/[bomId] — remover componente da BOM ─────────
export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: productId, bomId } = await params;

  try {
    // Verificar que o produto pertence ao utilizador
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    // Verificar que a entrada BOM pertence ao produto
    const existing = await prisma.productBOM.findFirst({
      where: { id: bomId, productId },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Entrada BOM não encontrada" },
        { status: 404 },
      );

    await prisma.productBOM.delete({ where: { id: bomId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/products/[id]/bom/[bomId]]", error);
    return NextResponse.json(
      { error: "Erro ao remover da BOM", details: error.message },
      { status: 500 },
    );
  }
}
