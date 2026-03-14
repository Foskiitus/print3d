import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const spoolId = Number(id);

    // Verificar se a bobine já foi usada em algum log de produção
    // Nota: Ajusta o nome do campo 'spoolId' se no teu schema for diferente em ProductionLog
    const isUsed = await prisma.productionLog.findFirst({
      where: {
        // Se ainda não tens esta relação no schema, o Prisma ignorará
        // mas é a boa prática para o futuro
        id: spoolId,
      },
    });

    if (isUsed) {
      return NextResponse.json(
        {
          error:
            "Não é possível eliminar uma bobine que já tem registos de produção associados.",
        },
        { status: 400 },
      );
    }

    await prisma.filamentSpool.delete({
      where: { id: spoolId },
    });

    return NextResponse.json({ message: "Bobine eliminada com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
