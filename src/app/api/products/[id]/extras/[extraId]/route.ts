// src/app/api/products/[id]/extras/[extraId]/route.ts
//
// PATCH /api/products/[id]/extras/[extraId]
//   Atualiza a quantidade de um ProductExtra.
//   Body: { quantity: number }
//
// DELETE /api/products/[id]/extras/[extraId]
//   Remove o ProductExtra (não elimina o Extra em si).

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── Helper: verificar posse ──────────────────────────────────────────────────

async function resolveEntry(
  productId: string,
  extraEntryId: string,
  userId: string,
) {
  // Verificar que o produto pertence ao utilizador
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  });
  if (!product) return null;

  // Carregar a entrada
  const entry = await prisma.productExtra.findFirst({
    where: { id: extraEntryId, productId },
  });
  return entry;
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; extraId: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: productId, extraId: extraEntryId } = await params;

  const entry = await resolveEntry(productId, extraEntryId, userId);
  if (!entry) {
    return NextResponse.json(
      { error: "Entrada não encontrada" },
      { status: 404 },
    );
  }

  const body = (await req.json()) as { quantity: number };
  const { quantity } = body;

  if (!quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "quantity deve ser maior que 0" },
      { status: 400 },
    );
  }

  const updated = await prisma.productExtra.update({
    where: { id: extraEntryId },
    data: { quantity },
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

  return NextResponse.json(updated);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; extraId: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: productId, extraId: extraEntryId } = await params;

  const entry = await resolveEntry(productId, extraEntryId, userId);
  if (!entry) {
    return NextResponse.json(
      { error: "Entrada não encontrada" },
      { status: 404 },
    );
  }

  await prisma.productExtra.delete({ where: { id: extraEntryId } });

  return NextResponse.json({ success: true });
}
