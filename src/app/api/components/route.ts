// src/app/api/components/route.ts

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/components ───────────────────────────────────────────────────────
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const components = await prisma.component.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        printProfiles: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json(components);
  } catch (error: any) {
    console.error("[GET /api/components]", error);
    return NextResponse.json(
      { error: "Erro ao obter componentes" },
      { status: 500 },
    );
  }
}

// ── POST /api/components ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, defaultMaterial, defaultColorHex } = body;

    if (!name?.trim())
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );

    const component = await prisma.component.create({
      data: {
        userId,
        name: name.trim(),
        description: description ?? null,
        defaultMaterial: defaultMaterial ?? null,
        defaultColorHex: defaultColorHex ?? null,
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/components]", error);
    return NextResponse.json(
      { error: "Erro ao criar componente", details: error.message },
      { status: 500 },
    );
  }
}
