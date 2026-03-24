// src/app/api/components/[id]/profiles/route.ts

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// ── POST /api/components/[id]/profiles ────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: componentId } = await params;

  try {
    // Verificar que o componente pertence ao utilizador
    const component = await prisma.component.findFirst({
      where: { id: componentId, userId },
    });
    if (!component)
      return NextResponse.json(
        { error: "Componente não encontrado" },
        { status: 404 },
      );

    const {
      name,
      filePath,
      batchSize = 1,
      printTime = null,
      filamentUsed = null,
      filaments = [],
    } = await req.json();

    if (!name?.trim())
      return NextResponse.json(
        { error: "Nome do perfil é obrigatório" },
        { status: 400 },
      );

    // filePath pode ser vazio se o upload falhou ou não foi feito
    // (perfil criado apenas com dados manuais)

    const profile = await prisma.componentPrintProfile.create({
      data: {
        componentId,
        name: name.trim(),
        filePath: filePath?.trim() || "",
        batchSize: Number(batchSize) || 1,
        printTime: printTime ? Number(printTime) : null,
        filamentUsed: filamentUsed ? Number(filamentUsed) : null,
        // Criar os requisitos de filamento em nested write
        filaments: {
          create: filaments.map(
            (f: {
              material: string;
              colorHex?: string | null;
              colorName?: string | null;
              estimatedG: number;
            }) => ({
              material: f.material,
              colorHex: f.colorHex ?? null,
              colorName: f.colorName ?? null,
              estimatedG: Number(f.estimatedG),
            }),
          ),
        },
      },
      include: { filaments: true },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/components/[id]/profiles]", error);
    return NextResponse.json(
      { error: "Erro ao criar perfil", details: error.message },
      { status: 500 },
    );
  }
}

// ── GET /api/components/[id]/profiles ─────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: componentId } = await params;

  try {
    const component = await prisma.component.findFirst({
      where: { id: componentId, userId },
    });
    if (!component)
      return NextResponse.json(
        { error: "Componente não encontrado" },
        { status: 404 },
      );

    const profiles = await prisma.componentPrintProfile.findMany({
      where: { componentId },
      include: { filaments: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error("[GET /api/components/[id]/profiles]", error);
    return NextResponse.json(
      { error: "Erro ao obter perfis" },
      { status: 500 },
    );
  }
}
