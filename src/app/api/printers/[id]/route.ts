// src/app/api/printers/[id]/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── PATCH /api/printers/[id] ─────────────────────────────────────────────────
// Atualiza campos editáveis da impressora (nome, hourlyCost, powerWatts, status).

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const printer = await prisma.printer.findFirst({ where: { id, userId } });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  try {
    const body = await req.json();

    const updated = await prisma.printer.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.hourlyCost !== undefined && {
          hourlyCost: Number(body.hourlyCost),
        }),
        ...(body.powerWatts !== undefined && {
          powerWatts: Number(body.powerWatts),
        }),
        ...(body.status !== undefined && { status: String(body.status) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH /api/printers/[id]]", error);
    return NextResponse.json(
      { error: "Falha ao atualizar impressora", details: error.message },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/printers/[id] ────────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const printer = await prisma.printer.findFirst({ where: { id, userId } });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  try {
    await prisma.printer.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error("[DELETE /api/printers/[id]]", error);
    return NextResponse.json(
      { error: "Falha ao eliminar impressora", details: error.message },
      { status: 500 },
    );
  }
}
