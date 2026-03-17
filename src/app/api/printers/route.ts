import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/printers
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const printers = await prisma.printer.findMany({
    where: { userId: userId },
    include: { preset: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(printers);
}

// POST /api/printers
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { name, hourlyCost, powerWatts, presetId } = await req.json();

    if (!name || hourlyCost === undefined || powerWatts === undefined) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    const printer = await prisma.printer.create({
      data: {
        userId: userId,
        name,
        hourlyCost: Number(hourlyCost),
        powerWatts: Number(powerWatts),
        presetId: presetId ?? null,
      },
      include: { preset: true },
    });

    return NextResponse.json(printer, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/printers]", error);
    return NextResponse.json(
      { error: "Falha ao criar impressora", details: error.message },
      { status: 500 },
    );
  }
}
