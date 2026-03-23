// src/app/api/printers/[id]/units/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── POST /api/printers/[id]/units ───────────────────────────────────────────
// Adiciona uma nova unidade de expansão à impressora e cria os slots automaticamente.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: printerId } = await params;

  // Verificar que a impressora pertence ao utilizador
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
  });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  try {
    const { presetId, name, slotCount, supportsHighTemp, supportsAbrasive } =
      await req.json();

    if (!name || !slotCount) {
      return NextResponse.json(
        { error: "name e slotCount são obrigatórios" },
        { status: 400 },
      );
    }

    const unit = await prisma.printerUnit.create({
      data: {
        printerId,
        presetId: presetId ?? null,
        name,
        slotCount: Number(slotCount),
        supportsHighTemp: Boolean(supportsHighTemp),
        supportsAbrasive: Boolean(supportsAbrasive),
        // Gerar slots automaticamente
        slots: {
          create: Array.from({ length: Number(slotCount) }, (_, i) => ({
            position: i + 1,
          })),
        },
      },
      include: {
        slots: {
          include: { currentSpool: { include: { item: true } } },
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/printers/[id]/units]", error);
    return NextResponse.json(
      { error: "Falha ao adicionar unidade", details: error.message },
      { status: 500 },
    );
  }
}
