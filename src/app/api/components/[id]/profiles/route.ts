// src/app/api/components/[id]/profiles/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/components/[id]/profiles
// Cria um perfil de impressão (receita) para um componente.
// batchSize define quantas unidades saem desta impressão.
// Custo unitário = (filamentUsed × €/g) / batchSize

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: componentId } = await params;

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
    slicer,
    printTime,
    filamentUsed,
    batchSize = 1,
    filaments = [],
  } = await req.json();

  if (!name?.trim())
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!filePath?.trim())
    return NextResponse.json(
      { error: "filePath é obrigatório" },
      { status: 400 },
    );
  if (batchSize < 1)
    return NextResponse.json(
      { error: "batchSize deve ser >= 1" },
      { status: 400 },
    );

  const profile = await prisma.componentPrintProfile.create({
    data: {
      componentId,
      name: name.trim(),
      filePath,
      slicer: slicer ?? null,
      printTime: printTime ?? null,
      filamentUsed: filamentUsed ?? null,
      batchSize,
      filaments: {
        create: filaments.map(
          (f: {
            material: string;
            colorHex?: string;
            colorName?: string;
            estimatedG: number;
          }) => ({
            material: f.material,
            colorHex: f.colorHex ?? null,
            colorName: f.colorName ?? null,
            estimatedG: f.estimatedG,
          }),
        ),
      },
    },
    include: { filaments: true },
  });

  return NextResponse.json(profile, { status: 201 });
}

// GET /api/components/[id]/profiles
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: componentId } = await params;

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
    orderBy: { createdAt: "asc" },
  });

  // Enriquecer com custo unitário calculado
  const enriched = profiles.map((p) => ({
    ...p,
    unitG: p.filamentUsed != null ? p.filamentUsed / p.batchSize : null,
  }));

  return NextResponse.json(enriched);
}
