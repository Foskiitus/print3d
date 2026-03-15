import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/customers
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

// POST /api/customers
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { name, email, phone, address, nif, notes } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        address: address || null,
        nif: nif || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/customers]", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente", details: error.message },
      { status: 500 },
    );
  }
}
