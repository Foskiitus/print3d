import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserIsAdmin } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await getAuthUserIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { id } = await params;

    await prisma.printerPreset.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Apagado com sucesso" });
  } catch (error) {
    console.error("[PRINTER_PRESET_DELETE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
