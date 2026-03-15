import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/filaments/spools/[id]/detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const spool = await prisma.filamentSpool.findUnique({
    where: { id },
    include: {
      filamentType: true,
      adjustments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!spool || spool.userId !== session.user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(spool);
}
