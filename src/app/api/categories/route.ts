import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/categories
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

// POST /api/categories
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/categories]", error);
    return NextResponse.json(
      { error: "Falha ao criar categoria", details: error.message },
      { status: 500 },
    );
  }
}
