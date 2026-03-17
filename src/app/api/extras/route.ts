import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/extras
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const extras = await prisma.extra.findMany({
    where: { userId: userId },
    include: { _count: { select: { usages: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(extras);
}

// POST /api/extras
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { name, description, price, unit } = await req.json();

    if (!name?.trim() || price === undefined) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 },
      );
    }

    const extra = await prisma.extra.create({
      data: {
        userId: userId,
        name: name.trim(),
        description: description || null,
        price: Number(price),
        unit: unit || null,
      },
    });

    return NextResponse.json(extra, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/extras]", error);
    return NextResponse.json(
      { error: "Falha ao criar extra", details: error.message },
      { status: 500 },
    );
  }
}
