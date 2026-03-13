import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Incluímos o tipo de filamento para o frontend saber a cor e marca do rolo
    const spools = await prisma.filamentSpool.findMany({
      include: { filamentType: true },
      orderBy: { purchaseDate: "desc" },
    });
    return NextResponse.json(spools);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar bobines" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { filamentTypeId, spoolWeight, price, purchaseDate } =
      await req.json();

    if (!filamentTypeId || !spoolWeight || !price) {
      return NextResponse.json(
        { error: "Faltam dados da bobine" },
        { status: 400 },
      );
    }

    const spool = await prisma.filamentSpool.create({
      data: {
        filamentTypeId: Number(filamentTypeId),
        spoolWeight: Number(spoolWeight),
        remaining: Number(spoolWeight), // Quando compras, o restante é igual ao peso total
        price: Number(price),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      },
    });
    return NextResponse.json(spool, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao adicionar bobine" },
      { status: 500 },
    );
  }
}
