// src/app/api/printers/[id]/slots/route.ts
//
// PUT /api/printers/[id]/slots
//
// Atualiza os slots de uma impressora — carrega ou descarrega bobines.
// Chamado pelo modal "Configurar Slots" antes de iniciar uma impressão.
//
// Body:
//   {
//     slots: [
//       { slotId: string, spoolId: string | null }
//       // spoolId: null = descarregar o slot
//     ]
//   }
//
// Efeitos:
//   - Atualiza PrinterSlot.currentSpoolId para cada slot enviado
//   - Grava PrinterSlot.loadedAt quando carrega uma bobine
//   - Remove loadedAt e currentSpoolId quando descarrega (spoolId: null)

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: printerId } = await params;

  // Verificar que a impressora pertence ao utilizador
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

  const { slots } = (await req.json()) as {
    slots: { slotId: string; spoolId: string | null }[];
  };

  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json(
      { error: "slots é obrigatório e deve ser um array" },
      { status: 400 },
    );
  }

  // Validar que todos os slotIds pertencem a esta impressora
  const allSlotIds = printer.units.flatMap((u) => u.slots.map((s) => s.id));
  const invalidSlots = slots.filter((s) => !allSlotIds.includes(s.slotId));
  if (invalidSlots.length > 0) {
    return NextResponse.json(
      { error: "Um ou mais slots não pertencem a esta impressora" },
      { status: 400 },
    );
  }

  // Validar que os spools pertencem ao utilizador (quando não são null)
  const spoolIds = slots.map((s) => s.spoolId).filter(Boolean) as string[];
  if (spoolIds.length > 0) {
    const validSpools = await prisma.inventoryPurchase.findMany({
      where: { id: { in: spoolIds }, userId, archivedAt: null },
      select: { id: true },
    });
    const validSpoolIds = new Set(validSpools.map((s) => s.id));
    const invalidSpools = spoolIds.filter((id) => !validSpoolIds.has(id));
    if (invalidSpools.length > 0) {
      return NextResponse.json(
        { error: "Uma ou mais bobines não encontradas no inventário" },
        { status: 400 },
      );
    }
  }

  // Actualizar cada slot numa transação
  await prisma.$transaction(
    slots.map(({ slotId, spoolId }) =>
      prisma.printerSlot.update({
        where: { id: slotId },
        data: {
          currentSpoolId: spoolId ?? null,
          loadedAt: spoolId ? new Date() : null,
        },
      }),
    ),
  );

  // Devolver o estado actualizado da impressora
  const updated = await prisma.printer.findUnique({
    where: { id: printerId },
    include: {
      units: {
        include: {
          slots: {
            include: {
              currentSpool: {
                include: { item: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(updated);
}
