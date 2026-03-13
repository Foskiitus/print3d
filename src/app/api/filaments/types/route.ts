import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.filamentType.findMany({
      orderBy: { brand: "asc" },
    });
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar tipos de filamento" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brand, material, color } = await req.json();

    if (!brand || !material || !color) {
      return NextResponse.json(
        { error: "Marca, material e cor são obrigatórios" },
        { status: 400 },
      );
    }

    const type = await prisma.filamentType.create({
      data: {
        brand: brand.trim(),
        material: material.trim(),
        color: color.trim(),
      },
    });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar tipo de filamento" },
      { status: 500 },
    );
  }
}
