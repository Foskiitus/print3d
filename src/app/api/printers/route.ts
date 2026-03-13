import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const printers = await prisma.printer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(printers);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar impressoras" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, hourlyCost, electricityW } = await req.json();

    if (!name)
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

    const printer = await prisma.printer.create({
      data: {
        name: name.trim(),
        hourlyCost: Number(hourlyCost) || 0,
        electricityW: Number(electricityW) || 0,
      },
    });
    return NextResponse.json(printer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar impressora" },
      { status: 500 },
    );
  }
}
