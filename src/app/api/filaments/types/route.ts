import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.filamentType.findMany({
      include: {
        _count: { select: { spools: true } },
      },
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
    const body = await req.json();
    console.log("DADOS RECEBIDOS NA API:", body);
    const { brand, material, colorName, colorHex } = body;

    // Validação básica
    if (!brand || !material || !colorName || !colorHex) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 },
      );
    }

    const newType = await prisma.filamentType.create({
      data: {
        brand: brand.trim(),
        material: material.trim(),
        colorName: colorName.trim(),
        colorHex: colorHex.trim(),
      },
      include: {
        _count: {
          select: { spools: true },
        },
      },
    });

    return NextResponse.json(newType, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de Filamentos:", error);
    return NextResponse.json(
      {
        error: "Falha ao comunicar com a base de dados",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
