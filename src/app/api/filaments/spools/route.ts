import { getUserId } from "@/lib/getUserId";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/filaments/spools
export async function GET() {
  const userId = await getUserId();

  const spools = await prisma.filamentSpool.findMany({
    where: { userId },
    include: {
      filamentType: true,
      _count: { select: { adjustments: true } }, // ✅ para controlar visibilidade do botão apagar
    },
    orderBy: { purchaseDate: "desc" },
  });

  return NextResponse.json(spools);
}

// POST /api/filaments/spools
export async function POST(req: Request) {
  const userId = await getUserId();

  try {
    const {
      filamentTypeId,
      spoolWeight,
      price,
      purchaseDate,
      quantity = 1,
    } = await req.json();

    if (!filamentTypeId || !spoolWeight || !price || !purchaseDate) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    const filamentType = await prisma.filamentType.findUnique({
      where: { id: filamentTypeId },
    });

    if (!filamentType || filamentType.userId !== userId) {
      return NextResponse.json(
        { error: "Tipo de filamento inválido" },
        { status: 403 },
      );
    }

    const parsedQty = Number(quantity);

    if (isNaN(parsedQty)) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 },
      );
    }

    const qty = Math.min(100, Math.max(1, parsedQty));

    // cria as bobines
    const spoolsData = Array.from({ length: qty }).map(() => ({
      userId,
      filamentTypeId,
      spoolWeight,
      remaining: spoolWeight,
      price,
      purchaseDate: new Date(purchaseDate),
    }));

    await prisma.filamentSpool.createMany({
      data: spoolsData,
    });

    // buscar as bobines recém criadas para devolver ao frontend
    const spools = await prisma.filamentSpool.findMany({
      where: {
        userId: userId,
        filamentTypeId,
        price,
        purchaseDate: new Date(purchaseDate),
      },
      include: {
        filamentType: true,
        _count: { select: { adjustments: true } },
      },
      orderBy: { purchaseDate: "desc" },
      take: qty,
    });

    return NextResponse.json(spools, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/filaments/spools]", error);
    return NextResponse.json(
      {
        error: "Falha ao comunicar com a base de dados",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
