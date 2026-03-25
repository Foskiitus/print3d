import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/admin/unit-presets
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const presets = await prisma.unitPreset.findMany({
    where: { isGlobal: true },
    orderBy: [{ brand: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(presets);
}

// POST /api/admin/unit-presets
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const {
      name,
      brand,
      slotCount,
      supportsHighTemp,
      supportsAbrasive,
      notes,
    } = await req.json();

    if (!name?.trim() || !brand?.trim()) {
      return NextResponse.json(
        { error: "Nome e marca são obrigatórios" },
        { status: 400 },
      );
    }

    const preset = await prisma.unitPreset.create({
      data: {
        name: name.trim(),
        brand: brand.trim(),
        slotCount: Number(slotCount) || 4,
        supportsHighTemp: supportsHighTemp ?? false,
        supportsAbrasive: supportsAbrasive ?? false,
        notes: notes || null,
        isGlobal: true,
      },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/unit-presets]", err);
    return NextResponse.json(
      { error: "Falha ao criar preset", details: err.message },
      { status: 500 },
    );
  }
}
