import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/products/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      // Agora usamos BOM em vez de filamentUsage
      bom: {
        include: {
          component: {
            include: {
              profiles: { include: { filaments: true } },
            },
          },
        },
      },
      extras: { include: { extra: true } },
      _count: { select: { sales: true } },
    },
  });

  if (!product || product.userId !== userId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}
