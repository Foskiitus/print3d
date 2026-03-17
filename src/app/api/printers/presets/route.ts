import { getAuthUserId, getAuthUserIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/printers/presets
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const presets = await prisma.printerPreset.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(presets);
}

// POST /api/printers/presets — apenas admin
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // ✅ Verificar role admin
  const isAdmin = await getAuthUserIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { name, hourlyCost, powerWatts } = await req.json();

    if (!name || hourlyCost === undefined || powerWatts === undefined) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    const preset = await prisma.printerPreset.create({
      data: {
        name,
        hourlyCost: Number(hourlyCost),
        powerWatts: Number(powerWatts),
      },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/printers/presets]", error);
    return NextResponse.json(
      { error: "Falha ao criar preset", details: error.message },
      { status: 500 },
    );
  }
}
