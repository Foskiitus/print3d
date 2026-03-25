// src/app/api/components/[id]/route.ts

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// ── GET /api/components/[id] ──────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const component = await prisma.component.findFirst({
    where: { id, userId },
    include: {
      profiles: {
        include: { filaments: true },
        orderBy: { createdAt: "desc" },
      },
      stock: true,
    },
  });

  if (!component)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(component);
}

// ── PATCH /api/components/[id] ────────────────────────────────────────────────
export async function PATCH(req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const component = await prisma.component.findFirst({ where: { id, userId } });
  if (!component)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const {
    name,
    description,
    defaultMaterial,
    defaultColorHex,
    specialHandling,
    requiresAdapter,
  } = body;

  const updated = await prisma.component.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(defaultMaterial !== undefined && { defaultMaterial }),
      ...(defaultColorHex !== undefined && { defaultColorHex }),
      ...(specialHandling !== undefined && { specialHandling }),
      ...(requiresAdapter !== undefined && { requiresAdapter }),
    },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/components/[id] ───────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const component = await prisma.component.findFirst({
    where: { id, userId },
    include: { bom: { select: { id: true } } },
  });

  if (!component)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (component.bom.length > 0)
    return NextResponse.json(
      {
        error: `Componente usado em ${component.bom.length} produto(s). Remove das BOMs primeiro.`,
      },
      { status: 409 },
    );

  await prisma.component.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
