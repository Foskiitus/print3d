import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/filaments/spools/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.filamentSpool.findUnique({
      where: { id },
      include: {
        _count: { select: { adjustments: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // ✅ Bloquear se tiver ajustes registados
    if (existing._count.adjustments > 0) {
      return NextResponse.json(
        {
          error: `Esta bobine tem ${existing._count.adjustments} ajuste(s) registado(s). Apaga os ajustes primeiro na página de detalhe da bobine.`,
        },
        { status: 409 },
      );
    }

    await prisma.filamentSpool.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/filaments/spools/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar", details: error.message },
      { status: 500 },
    );
  }
}
