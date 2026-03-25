import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/sales/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.sale.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 },
      );
    }

    const { quantity, salePrice, customerId, customerName, notes } =
      await req.json();

    const updated = await prisma.sale.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(salePrice !== undefined && { salePrice: Number(salePrice) }),
        ...(customerId !== undefined && {
          customerId: customerId === "none" ? null : customerId || null,
        }),
        ...(customerName !== undefined && {
          customerName: customerName?.trim() || null,
        }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
      include: {
        product: true,
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/sales/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao atualizar", details: err.message },
      { status: 500 },
    );
  }
}

// DELETE /api/sales/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.sale.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 },
      );
    }

    await prisma.sale.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/sales/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao eliminar", details: err.message },
      { status: 500 },
    );
  }
}
