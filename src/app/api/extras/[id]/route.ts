import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/extras/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.extra.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const {
      name,
      description,
      price,
      unit,
      category,
      quantity,
      alertThreshold,
    } = await req.json();

    const updated = await prisma.extra.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(unit !== undefined && { unit: unit || null }),
        ...(category !== undefined && { category: category || "hardware" }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(alertThreshold !== undefined && {
          alertThreshold:
            alertThreshold !== "" && alertThreshold !== null
              ? Number(alertThreshold)
              : null,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH /api/extras/[id]]", error);
    return NextResponse.json(
      { error: "Falha ao atualizar", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/extras/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.extra.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (existing._count.usages > 0) {
      return NextResponse.json(
        {
          error: `Este extra está a ser usado em ${existing._count.usages} produto(s). Remove-o dos produtos primeiro.`,
        },
        { status: 409 },
      );
    }

    await prisma.extra.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/extras/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar", details: error.message },
      { status: 500 },
    );
  }
}
