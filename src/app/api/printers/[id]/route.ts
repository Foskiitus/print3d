import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const printerId = Number(id);

    // Verificar se a impressora já foi usada em algum log de produção
    const isUsed = await prisma.productionLog.findFirst({
      where: { printerId: printerId },
    });

    if (isUsed) {
      return NextResponse.json(
        {
          error:
            "Não é possível eliminar uma impressora que já realizou trabalhos de produção.",
        },
        { status: 400 },
      );
    }

    await prisma.printer.delete({
      where: { id: printerId },
    });

    return NextResponse.json({ message: "Impressora removida com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
