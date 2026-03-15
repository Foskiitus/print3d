import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/filaments/spools
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const spools = await prisma.filamentSpool.findMany({
    where: { userId: session.user.id },
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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { filamentTypeId, spoolWeight, price, purchaseDate } =
      await req.json();

    if (!filamentTypeId || !spoolWeight || !price || !purchaseDate) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    const filamentType = await prisma.filamentType.findUnique({
      where: { id: filamentTypeId },
    });

    if (!filamentType || filamentType.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Tipo de filamento inválido" },
        { status: 403 },
      );
    }

    const spool = await prisma.filamentSpool.create({
      data: {
        userId: session.user.id,
        filamentTypeId,
        spoolWeight,
        remaining: spoolWeight,
        price,
        purchaseDate: new Date(purchaseDate),
      },
      include: {
        filamentType: true,
        _count: { select: { adjustments: true } },
      },
    });

    return NextResponse.json(spool, { status: 201 });
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
