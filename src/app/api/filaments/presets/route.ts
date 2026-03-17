import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — lista todos os presets (qualquer utilizador autenticado)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const presets = await prisma.filamentPreset.findMany({
    orderBy: [{ brand: "asc" }, { material: "asc" }, { colorName: "asc" }],
  });

  return NextResponse.json(presets);
}

// POST — criar preset (apenas admin)
export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas admins podem criar presets" },
      { status: 403 },
    );
  }

  const { brand, material, colorName, colorHex } = await req.json();

  if (
    !brand?.trim() ||
    !material?.trim() ||
    !colorName?.trim() ||
    !colorHex?.trim()
  ) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios" },
      { status: 400 },
    );
  }

  const preset = await prisma.filamentPreset.create({
    data: {
      brand: brand.trim(),
      material: material.trim(),
      colorName: colorName.trim(),
      colorHex: colorHex.trim(),
    },
  });

  return NextResponse.json(preset);
}
