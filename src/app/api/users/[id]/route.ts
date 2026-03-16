import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
  });

  if (!currentUser || (currentUser.role !== "admin" && currentUser.id !== id)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id } });
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
