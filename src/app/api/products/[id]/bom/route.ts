// src/app/api/products/[productId]/bom/route.ts

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// ── GET /api/products/[productId]/bom ─────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: productId } = await params;

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    const bom = await prisma.productBOM.findMany({
      where: { productId },
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
      orderBy: { id: "asc" },
    });

    return NextResponse.json(bom);
  } catch (error: any) {
    console.error("[GET /api/products/[productId]/bom]", error);
    return NextResponse.json({ error: "Erro ao obter BOM" }, { status: 500 });
  }
}

// ── POST /api/products/[productId]/bom ────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: productId } = await params;

  try {
    const { componentId, quantity = 1 } = await req.json();

    if (!componentId)
      return NextResponse.json(
        { error: "componentId é obrigatório" },
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

    // Verificar que o componente pertence ao utilizador
    const component = await prisma.component.findFirst({
      where: { id: componentId, userId },
    });
    if (!component)
      return NextResponse.json(
        { error: "Componente não encontrado" },
        { status: 404 },
      );

    // Upsert — cria ou incrementa quantidade (aproveitando o @@unique)
    const existing = await prisma.productBOM.findUnique({
      where: { productId_componentId: { productId, componentId } },
    });

    const bomEntry = existing
      ? await prisma.productBOM.update({
          where: { productId_componentId: { productId, componentId } },
          data: { quantity: existing.quantity + quantity },
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
        })
      : await prisma.productBOM.create({
          data: { productId, componentId, quantity },
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

    return NextResponse.json(bomEntry, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products/[productId]/bom]", error);
    return NextResponse.json(
      { error: "Erro ao adicionar à BOM", details: error.message },
      { status: 500 },
    );
  }
}
