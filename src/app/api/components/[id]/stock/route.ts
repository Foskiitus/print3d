// src/app/api/components/[id]/stock/route.ts

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// ── PUT /api/components/[id]/stock ────────────────────────────────────────────
export async function PUT(req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: componentId } = await params;

  const component = await prisma.component.findFirst({
    where: { id: componentId, userId },
  });
  if (!component)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { quantity } = await req.json();
  if (typeof quantity !== "number" || quantity < 0)
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });

  // upsert — cria ou actualiza o registo de stock
  const stock = await prisma.componentStock.upsert({
    where: { componentId },
    update: { quantity },
    create: { componentId, quantity },
  });

  return NextResponse.json(stock);
}
