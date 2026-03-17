import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/filaments/types
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const types = await prisma.filamentType.findMany({
    where: { userId: userId },
    include: { _count: { select: { spools: true } } },
    orderBy: { brand: "asc" },
  });

  return NextResponse.json(types);
}

// POST /api/filaments/types
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { brand, material, colorName, colorHex, alertThreshold } =
      await req.json();

    if (!brand || !material || !colorName || !colorHex) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    const filamentType = await prisma.filamentType.create({
      data: {
        userId: userId, // ✅ campo que estava em falta
        brand,
        material,
        colorName,
        colorHex,
        alertThreshold: alertThreshold != null ? Number(alertThreshold) : null,
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
