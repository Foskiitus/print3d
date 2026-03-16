import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { brand, material, colorHex, colorName, alertThreshold } =
    await req.json();

  // Garante que o utilizador só edita os seus próprios materiais
  const existing = await prisma.filamentType.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.filamentType.update({
    where: { id },
    data: { brand, material, colorHex, colorName, alertThreshold },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params; // ← tem de estar ANTES do try

  try {
    const existing = await prisma.filamentType.findUnique({
      where: { id }, // ← usa "id", não "params.id"
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await prisma.filamentType.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/filaments/types/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar", details: error.message },
      { status: 500 },
    );
  }
}
