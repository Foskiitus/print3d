import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/extras/[id]
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
    const existing = await prisma.extra.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Bloquear se estiver a ser usado em produtos
    if (existing._count.usages > 0) {
      return NextResponse.json(
        {
          error: `Este extra está a ser usado em ${existing._count.usages} produto(s). Remove-o dos produtos primeiro.`,
        },
        { status: 409 },
      );
    }

    await prisma.extra.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/extras/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar", details: error.message },
      { status: 500 },
    );
  }
}
