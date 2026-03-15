import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/filaments/spools/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.filamentSpool.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};

    if ("alertThreshold" in body) {
      data.alertThreshold =
        body.alertThreshold != null ? Number(body.alertThreshold) : null;
    }

    const spool = await prisma.filamentSpool.update({ where: { id }, data });
    return NextResponse.json(spool);
  } catch (error: any) {
    console.error("[PATCH /api/filaments/spools/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar bobine", details: error.message },
      { status: 500 },
    );
  }
}

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
      include: { _count: { select: { adjustments: true } } },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (existing._count.adjustments > 0) {
      return NextResponse.json(
        { error: "Não é possível apagar uma bobine com ajustes registados." },
        { status: 409 },
      );
    }

    await prisma.filamentSpool.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/filaments/spools/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao apagar bobine", details: error.message },
      { status: 500 },
    );
  }
}
