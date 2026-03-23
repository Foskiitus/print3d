// src/app/api/printers/[id]/slots/[slotId]/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── PATCH /api/printers/[id]/slots/[slotId] ─────────────────────────────────
// Associa ou remove um rolo de um slot.
//
// Body:
//   { spoolId: string }  → associar rolo ao slot
//   { spoolId: null }    → esvaziar slot (rolo volta ao stock)
//
// Lógica de troca inteligente:
//   1. Se o slot já tinha um rolo, esse rolo volta ao stock (archivedAt = null)
//   2. O novo rolo é marcado como "em uso" (associado ao slot)
//   3. Devolve o slot atualizado com o novo currentSpool

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: printerId, slotId } = await params;

  // Verificar que a impressora pertence ao utilizador
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
  });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  // Verificar que o slot pertence a uma unidade desta impressora
  const slot = await prisma.printerSlot.findFirst({
    where: {
      id: slotId,
      unit: { printerId },
    },
    include: {
      currentSpool: true,
    },
  });
  if (!slot)
    return NextResponse.json({ error: "Slot não encontrado" }, { status: 404 });

  try {
    const { spoolId } = await req.json(); // null = esvaziar

    // ── Verificar novo rolo (se fornecido) ─────────────────────────────────
    if (spoolId !== null && spoolId !== undefined) {
      const newSpool = await prisma.inventoryPurchase.findFirst({
        where: { id: spoolId, userId },
      });
      if (!newSpool)
        return NextResponse.json(
          { error: "Rolo não encontrado no inventário" },
          { status: 404 },
        );

      // Verificar se o rolo já está carregado noutro slot
      const alreadyLoaded = await prisma.printerSlot.findFirst({
        where: { currentSpoolId: spoolId, id: { not: slotId } },
      });
      if (alreadyLoaded)
        return NextResponse.json(
          { error: "Este rolo já está carregado noutro slot" },
          { status: 409 },
        );
    }

    // ── Transação: trocar rolo no slot ─────────────────────────────────────
    const updatedSlot = await prisma.$transaction(async (tx) => {
      // 1. Se havia um rolo no slot, libertá-lo (fica disponível no stock)
      //    Não alteramos archivedAt — ele continua activo no inventário.
      //    A ligação ao slot é removida automaticamente pelo update abaixo.

      // 2. Atualizar o slot com o novo rolo (ou null para esvaziar)
      const updated = await tx.printerSlot.update({
        where: { id: slotId },
        data: { currentSpoolId: spoolId ?? null },
        include: {
          currentSpool: {
            include: { item: true },
          },
        },
      });

      return updated;
    });

    return NextResponse.json(updatedSlot);
  } catch (error: any) {
    console.error("[PATCH /api/printers/[id]/slots/[slotId]]", error);
    return NextResponse.json(
      { error: "Falha ao associar rolo", details: error.message },
      { status: 500 },
    );
  }
}
