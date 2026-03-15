import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/filaments/spools/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }, // ✅ Next.js 15: params é uma Promise
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params; // ✅ await obrigatório no Next.js 15

  try {
    const existing = await prisma.filamentSpool.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await prisma.filamentSpool.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/filaments/spools/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar", details: error.message },
      { status: 500 },
    );
  }
}
