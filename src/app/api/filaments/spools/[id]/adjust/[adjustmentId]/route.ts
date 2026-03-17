import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/filaments/spools/[id]/adjust/[adjustmentId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; adjustmentId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id, adjustmentId } = await params;

  try {
    // Verificar que o ajuste pertence ao utilizador
    const adjustment = await prisma.spoolAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { spool: true },
    });

    if (!adjustment || adjustment.userId !== userId) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (adjustment.spoolId !== id) {
      return NextResponse.json(
        { error: "Ajuste não pertence a esta bobine" },
        { status: 400 },
      );
    }

    // Reverter o peso e apagar o ajuste numa transação
    await prisma.$transaction([
      prisma.filamentSpool.update({
        where: { id },
        data: {
          // Reverter: se o ajuste foi -20g, somamos +20g de volta
          remaining: { increment: -adjustment.amount },
        },
      }),
      prisma.spoolAdjustment.delete({
        where: { id: adjustmentId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(
      "[DELETE /api/filaments/spools/[id]/adjust/[adjustmentId]]",
      error,
    );
    return NextResponse.json(
      { error: "Erro ao apagar ajuste", details: error.message },
      { status: 500 },
    );
  }
}
