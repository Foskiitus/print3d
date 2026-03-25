import { getAuthUserId, requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/categories
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: userId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

// POST /api/categories
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

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
        userId: userId,
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
