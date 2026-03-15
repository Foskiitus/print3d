import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateFIFOCost } from "@/lib/fifo";

// POST /api/products/estimate-cost
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { filamentUsages, extraUsages, margin } = await req.json();

    const userId = session.user.id;

    // ✅ Custo FIFO com distribuição por múltiplas bobines
    const { filamentCost, missingSpools } = await calculateFIFOCost(
      userId,
      filamentUsages || [],
    );

    // Custo dos extras
    let extrasCost = 0;
    for (const usage of extraUsages || []) {
      const extra = await prisma.extra.findUnique({
        where: { id: usage.extraId },
      });
      if (extra) {
        extrasCost += extra.price * usage.quantity;
      }
    }

    const totalCost = filamentCost + extrasCost;
    const marginRate = margin ?? 0.3;
    const suggestedPrice = totalCost * (1 + marginRate);

    return NextResponse.json({
      filamentCost: Math.round(filamentCost * 1000) / 1000,
      extrasCost: Math.round(extrasCost * 1000) / 1000,
      totalCost: Math.round(totalCost * 1000) / 1000,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      missingSpools,
    });
  } catch (error: any) {
    console.error("[POST /api/products/estimate-cost]", error);
    return NextResponse.json(
      { error: "Erro ao calcular custo", details: error.message },
      { status: 500 },
    );
  }
}
