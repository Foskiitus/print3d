import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  // 1. Verificar se quem apaga é Admin ou o próprio
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
  });

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.id !== params.id)
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    await prisma.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json({
      message: "Utilizador e todos os seus dados removidos",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao remover utilizador" },
      { status: 500 },
    );
  }
}
