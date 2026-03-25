import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/printers/[id]/units
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id: printerId } = await params;

  try {
    const { presetId, name } = await req.json();

    // Verificar que a impressora pertence ao utilizador
    const printer = await prisma.printer.findFirst({
      where: { id: printerId, userId },
    });
    if (!printer) {
      return NextResponse.json(
        { error: "Impressora não encontrada" },
        { status: 404 },
      );
    }

    // Buscar o preset para saber quantos slots criar
    const preset = presetId
      ? await prisma.unitPreset.findUnique({ where: { id: presetId } })
      : null;

    const slotCount = preset?.slotCount ?? 4;

    const unit = await prisma.printerUnit.create({
      data: {
        printerId,
        presetId: presetId || null,
        name: name?.trim() || preset?.name || "AMS",
        slotCount,
        supportsHighTemp: preset?.supportsHighTemp ?? false,
        supportsAbrasive: preset?.supportsAbrasive ?? false,
        slots: {
          create: Array.from({ length: slotCount }, (_, i) => ({
            position: i,
          })),
        },
      },
      include: {
        unitPreset: true,
        slots: true,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/printers/[id]/units]", err);
    return NextResponse.json(
      { error: "Falha ao adicionar unidade", details: err.message },
      { status: 500 },
    );
  }
}
