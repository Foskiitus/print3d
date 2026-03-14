import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const typeId = Number(id);

    // Verificar se existem bobines associadas para evitar erro de chave estrangeira
    const hasSpools = await prisma.filamentSpool.findFirst({
      where: { filamentTypeId: typeId },
    });

    if (hasSpools) {
      return NextResponse.json(
        {
          error:
            "Não é possível eliminar material com bobines em stock. Elimina primeiro as bobines.",
        },
        { status: 400 },
      );
    }

    await prisma.filamentType.delete({
      where: { id: typeId },
    });

    return NextResponse.json({ message: "Material eliminado com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
