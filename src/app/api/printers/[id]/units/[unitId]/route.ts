// src/app/api/printers/[id]/units/[unitId]/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── DELETE /api/printers/[id]/units/[unitId] ─────────────────────────────────
// Remove uma unidade de expansão e todos os seus slots (cascade).

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: printerId, unitId } = await params;

  // Verificar que a impressora pertence ao utilizador
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
  });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  // Verificar que a unidade pertence à impressora
  const unit = await prisma.printerUnit.findFirst({
    where: { id: unitId, printerId },
  });
  if (!unit)
    return NextResponse.json(
      { error: "Unidade não encontrada" },
      { status: 404 },
    );

  try {
    await prisma.printerUnit.delete({ where: { id: unitId } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error("[DELETE /api/printers/[id]/units/[unitId]]", error);
    return NextResponse.json(
      { error: "Falha ao remover unidade", details: error.message },
      { status: 500 },
    );
  }
}
