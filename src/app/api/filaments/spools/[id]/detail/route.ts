import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/filaments/spools/[id]/detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const spool = await prisma.filamentSpool.findUnique({
    where: { id },
    include: {
      filamentType: true,
      adjustments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!spool || spool.userId !== userId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(spool);
}
