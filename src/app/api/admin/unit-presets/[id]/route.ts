import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/admin/unit-presets/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.unitPreset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.unitPreset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/unit-presets/[id]]", err);
    return NextResponse.json(
      { error: "Falha ao eliminar", details: err.message },
      { status: 500 },
    );
  }
}
