import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/printers/presets/[id] — apenas admin
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.printerPreset.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    // Desligar impressoras que usam este preset (não apagar, só limpar presetId)
    await prisma.printer.updateMany({
      where: { presetId: id },
      data: { presetId: null },
    });

    await prisma.printerPreset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/printers/presets/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar preset", details: error.message },
      { status: 500 },
    );
  }
}
