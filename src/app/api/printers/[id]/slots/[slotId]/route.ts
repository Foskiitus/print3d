// src/app/api/printers/[id]/slots/[slotId]/route.ts
//
// PATCH /api/printers/[id]/slots/[slotId]
//
// Carrega ou descarrega uma única bobine num slot específico.
// Chamado pelo SpoolDetailModal (Retirar) e pelo SlotAssignModal (associar).
//
// Body:
//   { spoolId: string | null }
//
// Efeitos:
//   - Atualiza PrinterSlot.currentSpoolId
//   - Grava PrinterSlot.loadedAt quando carrega (spoolId != null)
//   - Remove loadedAt quando descarrega (spoolId: null)
//
// Resposta:
//   O slot atualizado com currentSpool incluído.

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: printerId, slotId } = await params;

  // Verify the printer belongs to the authenticated user
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    include: {
      units: {
        include: { slots: true },
      },
    },
  });

  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  // Verify the slot belongs to this printer
  const allSlotIds = printer.units.flatMap((u) => u.slots.map((s) => s.id));
  if (!allSlotIds.includes(slotId)) {
    return NextResponse.json(
      { error: "Slot não encontrado nesta impressora" },
      { status: 404 },
    );
  }

  const body = (await req.json()) as { spoolId: string | null };
  const { spoolId } = body;

  // When loading a spool, verify it belongs to the user and is not archived
  if (spoolId) {
    const spool = await prisma.inventoryPurchase.findFirst({
      where: { id: spoolId, userId, archivedAt: null },
    });
    if (!spool) {
      return NextResponse.json(
        { error: "Bobine não encontrada no inventário" },
        { status: 404 },
      );
    }
  }

  // Update the slot
  await prisma.printerSlot.update({
    where: { id: slotId },
    data: {
      currentSpoolId: spoolId ?? null,
      loadedAt: spoolId ? new Date() : null,
    },
  });

  // Return the updated slot with full spool details so the frontend
  // can update its local state without a full page refresh
  const updatedSlot = await prisma.printerSlot.findUnique({
    where: { id: slotId },
    include: {
      currentSpool: {
        include: { item: true },
      },
    },
  });

  return NextResponse.json(updatedSlot);
}
