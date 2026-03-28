import { NextRequest, NextResponse } from "next/server";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string; unitId: string }>;
}

type SlotRow = { id: string; currentSpoolId: string | null };

// DELETE /api/printers/[id]/units/[unitId]
// Remove uma unidade de expansão. Os spools nos slots voltam ao stock
// automaticamente — limpamos o currentSpoolId de cada slot antes de apagar.
export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = await requirePageAuth();
  const { id: printerId, unitId } = await params;

  // 1. Verificar que a impressora pertence ao utilizador
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    select: { id: true },
  });
  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  // 2. Verificar que a unidade pertence a esta impressora
  const unit = await prisma.printerUnit.findFirst({
    where: { id: unitId, printerId },
    select: {
      id: true,
      slots: { select: { id: true, currentSpoolId: true } },
    },
  });
  if (!unit) {
    return NextResponse.json(
      { error: "Unidade não encontrada" },
      { status: 404 },
    );
  }

  // 3. Libertar todos os spools carregados nos slots desta unidade
  const loadedSlotIds = unit.slots
    .filter((s: SlotRow) => s.currentSpoolId !== null)
    .map((s: SlotRow) => s.id);

  if (loadedSlotIds.length > 0) {
    await prisma.printerSlot.updateMany({
      where: { id: { in: loadedSlotIds } },
      data: { currentSpoolId: null, loadedAt: null },
    });
  }

  // 4. Apagar a unidade (slots removidos em cascade pelo Prisma)
  await prisma.printerUnit.delete({ where: { id: unitId } });

  return NextResponse.json({ success: true });
}
