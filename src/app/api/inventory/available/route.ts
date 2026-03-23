// src/app/api/inventory/available/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── GET /api/inventory/available ────────────────────────────────────────────
// Devolve os rolos do utilizador que estão disponíveis para carregar:
//   - não arquivados (archivedAt = null)
//   - não carregados em nenhum slot (loadedInSlot = null)

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const spools = await prisma.inventoryPurchase.findMany({
    where: {
      userId,
      archivedAt: null,
      loadedInSlot: null, // não está em nenhum slot
    },
    include: {
      item: true,
    },
    orderBy: [{ item: { material: "asc" } }, { boughtAt: "asc" }],
  });

  return NextResponse.json(
    spools.map((s) => ({
      id: s.id,
      qrCodeId: s.qrCodeId,
      currentWeight: s.currentWeight,
      initialWeight: s.initialWeight,
      priceCents: s.priceCents,
      item: {
        brand: s.item.brand,
        material: s.item.material,
        colorName: s.item.colorName,
        colorHex: s.item.colorHex,
      },
    })),
  );
}
