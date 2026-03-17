import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE — apagar preset (apenas admin)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas admins podem apagar presets" },
      { status: 403 },
    );
  }

  const { id } = await params;

  await prisma.filamentPreset.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
