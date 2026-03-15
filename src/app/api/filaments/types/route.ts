import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/filaments/types
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const types = await prisma.filamentType.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { spools: true } } },
    orderBy: { brand: "asc" },
  });

  return NextResponse.json(types);
}

// POST /api/filaments/types
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { brand, material, colorName, colorHex } = await req.json();

    if (!brand || !material || !colorName || !colorHex) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    const filamentType = await prisma.filamentType.create({
      data: {
        userId: session.user.id, // ✅ campo que estava em falta
        brand,
        material,
        colorName,
        colorHex,
      },
      include: {
        _count: { select: { spools: true } },
      },
    });

    return NextResponse.json(filamentType, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/filaments/types]", error);
    return NextResponse.json(
      {
        error: "Falha ao comunicar com a base de dados",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
