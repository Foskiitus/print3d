import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/production/orders/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.productionOrder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }

    const { status, notes } = await req.json();

    const updated = await prisma.productionOrder.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/production/orders/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao atualizar", details: err.message },
      { status: 500 },
    );
  }
}

// DELETE /api/production/orders/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.productionOrder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }

    await prisma.productionOrder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/production/orders/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao eliminar", details: err.message },
      { status: 500 },
    );
  }
}
