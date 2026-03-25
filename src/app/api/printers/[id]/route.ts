import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/printers/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();

    // Garantir que pertence ao utilizador
    const existing = await prisma.printer.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Impressora não encontrada" },
        { status: 404 },
      );
    }

    const updated = await prisma.printer.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.status && { status: body.status }),
        ...(body.hourlyCost !== undefined && {
          hourlyCost: Number(body.hourlyCost),
        }),
        ...(body.powerWatts !== undefined && {
          powerWatts: Number(body.powerWatts),
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/printers/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao atualizar", details: err.message },
      { status: 500 },
    );
  }
}

// DELETE /api/printers/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.printer.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Impressora não encontrada" },
        { status: 404 },
      );
    }

    await prisma.printer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/printers/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao eliminar", details: err.message },
      { status: 500 },
    );
  }
}
