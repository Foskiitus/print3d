import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/customers/[id]
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
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const { name, email, phone, address, nif, notes } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        address: address || null,
        nif: nif || null,
        notes: notes || null,
      },
      include: { _count: { select: { sales: true } } },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("[PATCH /api/customers/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/customers/[id]
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
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    // Desligar vendas deste cliente (não apagar)
    await prisma.sale.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/customers/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar cliente", details: error.message },
      { status: 500 },
    );
  }
}
