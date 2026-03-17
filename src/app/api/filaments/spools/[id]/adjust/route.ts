import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/filaments/spools/[id]/adjust
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  try {
    const { amount, reason } = await req.json();

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 },
      );
    }

    // Verificar que a bobine pertence ao utilizador
    const spool = await prisma.filamentSpool.findUnique({
      where: { id },
    });

    if (!spool) {
      return NextResponse.json(
        { error: "Bobine não encontrada" },
        { status: 404 },
      );
    }

    if (spool.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const adjustAmount = Number(amount);
    const newRemaining = spool.remaining + adjustAmount;

    if (newRemaining < 0) {
      return NextResponse.json(
        {
          error: `Ajuste inválido: o peso restante não pode ser negativo (atual: ${spool.remaining}g)`,
        },
        { status: 400 },
      );
    }

    // Registar ajuste e atualizar remaining numa transação
    const [adjustment, updatedSpool] = await prisma.$transaction([
      prisma.spoolAdjustment.create({
        data: {
          userId: userId,
          spoolId: id,
          amount: adjustAmount,
          reason: reason || null,
        },
      }),
      prisma.filamentSpool.update({
        where: { id },
        data: { remaining: newRemaining },
        include: { filamentType: true },
      }),
    ]);

    return NextResponse.json({ adjustment, spool: updatedSpool });
  } catch (error: any) {
    console.error("[POST /api/filaments/spools/[id]/adjust]", error);
    return NextResponse.json(
      { error: "Erro ao registar ajuste", details: error.message },
      { status: 500 },
    );
  }
}

// GET /api/filaments/spools/[id]/adjust — histórico de ajustes
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const spool = await prisma.filamentSpool.findUnique({ where: { id } });

  if (!spool || spool.userId !== userId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const adjustments = await prisma.spoolAdjustment.findMany({
    where: { spoolId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(adjustments);
}
