import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/sales/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const { customerName, customerId, quantity, notes } = await req.json();

    // Verificar stock se quantidade aumentou
    if (quantity && quantity !== existing.quantity) {
      const [productionTotal, salesTotal] = await Promise.all([
        prisma.productionLog.aggregate({
          where: { userId: session.user.id, productId: existing.productId },
          _sum: { quantity: true },
        }),
        prisma.sale.aggregate({
          where: { userId: session.user.id, productId: existing.productId },
          _sum: { quantity: true },
        }),
      ]);

      const currentStock =
        (productionTotal._sum.quantity ?? 0) - (salesTotal._sum.quantity ?? 0);

      // Stock disponível = stock atual + quantidade desta venda (antes da edição)
      const availableStock = currentStock + existing.quantity;

      if (quantity > availableStock) {
        return NextResponse.json(
          {
            error: `Stock insuficiente. Disponível: ${availableStock} unidade(s).`,
          },
          { status: 409 },
        );
      }
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        customerId:
          customerId !== undefined ? customerId || null : existing.customerId,
        customerName:
          customerName !== undefined
            ? customerName || null
            : existing.customerName,
        quantity: quantity ? Number(quantity) : existing.quantity,
        notes: notes !== undefined ? notes || null : existing.notes,
      },
      include: { product: true },
    });

    return NextResponse.json({
      ...sale,
      date: sale.date.toISOString(),
      product: {
        ...sale.product,
        createdAt: sale.product.createdAt.toISOString(),
        updatedAt: sale.product.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/sales/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar venda", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/sales/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.sale.findUnique({ where: { id } });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.sale.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/sales/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao apagar venda", details: error.message },
      { status: 500 },
    );
  }
}
