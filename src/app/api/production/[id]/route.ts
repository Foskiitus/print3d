import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/production/[id]
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
    const existing = await prisma.productionLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const { printTime, notes } = await req.json();

    const log = await prisma.productionLog.update({
      where: { id },
      data: {
        printTime: printTime ?? null,
        notes: notes ?? null,
      },
      include: { product: true, printer: true },
    });

    return NextResponse.json({
      ...log,
      date: log.date.toISOString(),
      product: {
        ...log.product,
        createdAt: log.product.createdAt.toISOString(),
        updatedAt: log.product.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/production/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar registo", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/production/[id]
// Apaga o registo de produção — o stock de produto é recalculado automaticamente
// (stock = SUM(production) - SUM(sales)), não precisa de reverter manualmente.
// O filamento já foi consumido das bobines — não revertemos para manter o histórico correto.
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
    const existing = await prisma.productionLog.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.productionLog.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/production/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao apagar registo", details: error.message },
      { status: 500 },
    );
  }
}
