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
    const {
      filamentUsages,
      extraUsages,
      margin,
      unitsPerPrint,
      printerId,
      productionTime, // minutos
    } = await req.json();

    const userId = session.user.id;
    const units = Math.max(1, Number(unitsPerPrint) || 1);

    // 1. Custo FIFO filamentos
    const { filamentCost, missingSpools } = await calculateFIFOCost(
      userId,
      filamentUsages || [],
    );

    // 2. Custo extras
    let extrasCost = 0;
    for (const usage of extraUsages || []) {
      const extra = await prisma.extra.findUnique({
        where: { id: usage.extraId },
      });
      if (extra) extrasCost += extra.price * usage.quantity;
    }

    // 3. Custo impressora + energia (só se impressora e tempo definidos)
    let printerCost: number | null = null;
    let electricityCost: number | null = null;

    if (printerId && productionTime) {
      const printer = await prisma.printer.findUnique({
        where: { id: printerId },
      });

      if (printer && printer.userId === userId) {
        const printHours = productionTime / 60;

        printerCost = printHours * printer.hourlyCost;

        // Preço da eletricidade das settings (default 0.20€/kWh)
        const electricitySetting = await prisma.settings.findUnique({
          where: { userId_key: { userId, key: "electricityPrice" } },
        });
        const electricityPrice = electricitySetting
          ? Number(electricitySetting.value)
          : 0.2;

        electricityCost =
          (printer.powerWatts / 1000) * printHours * electricityPrice;
      }
    }

    const totalCost =
      filamentCost + extrasCost + (printerCost ?? 0) + (electricityCost ?? 0);

    const marginRate = margin ?? 0.3;
    const suggestedPrice = totalCost * (1 + marginRate);
    const costPerUnit = totalCost / units;
    const pricePerUnit = suggestedPrice / units;

    return NextResponse.json({
      filamentCost: Math.round(filamentCost * 1000) / 1000,
      extrasCost: Math.round(extrasCost * 1000) / 1000,
      printerCost:
        printerCost !== null ? Math.round(printerCost * 1000) / 1000 : null,
      electricityCost:
        electricityCost !== null
          ? Math.round(electricityCost * 1000) / 1000
          : null,
      totalCost: Math.round(totalCost * 1000) / 1000,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 1000) / 1000,
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      unitsPerPrint: units,
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
