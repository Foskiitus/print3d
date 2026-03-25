import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

// GET /api/inventory/[id]/history
// Devolve o histórico de produções que usaram o mesmo InventoryItem deste rolo
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  // Busca o rolo para obter o itemId
  const purchase = await prisma.inventoryPurchase.findUnique({
    where: { id },
    select: { userId: true, itemId: true, item: true },
  });

  if (!purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Busca produções do utilizador que usaram filamentos com a mesma marca/material/cor
  // (ligação por ProductionLog → Product → ProductFilamentUsage → FilamentType)
  // Como a nova estrutura não tem ainda a ligação directa, devolvemos as produções recentes
  // const productions = await prisma.productionLog.findMany({
  //   where: { userId },
  //   include: {
  //     product: { select: { name: true } },
  //     printer: { select: { name: true } },
  //   },
  //   orderBy: { date: "desc" },
  //   take: 20,
  // });

  const productions = [] as any[];

  return NextResponse.json({
    item: purchase.item,
    productions: productions.map((p) => ({
      id: p.id,
      date: p.date,
      productName: p.product.name,
      printerName: p.printer.name,
      quantity: p.quantity,
      filamentUsed: p.filamentUsed,
      totalCost: p.totalCost,
    })),
  });
}
