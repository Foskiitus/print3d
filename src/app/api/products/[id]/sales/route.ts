import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Verificar que o produto pertence ao utilizador
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.userId !== userId) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 },
    );
  }

  const sales = await prisma.sale.findMany({
    where: { userId, productId: id },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(
    sales.map((s) => ({
      ...s,
      date: s.date.toISOString(),
    })),
  );
}
