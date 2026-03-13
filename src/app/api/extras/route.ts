import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const extras = await prisma.extra.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(extras);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar extras" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, price } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 },
      );
    }

    const extra = await prisma.extra.create({
      data: { name: name.trim(), price: Number(price) },
    });
    return NextResponse.json(extra, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao adicionar extra" },
      { status: 500 },
    );
  }
}
