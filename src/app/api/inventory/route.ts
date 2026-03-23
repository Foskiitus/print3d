import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

function generateQrCodeId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `SPL-${part}`;
}

async function uniqueQrCodeId(): Promise<string> {
  let id = generateQrCodeId();
  let exists = await prisma.inventoryPurchase.findUnique({
    where: { qrCodeId: id },
  });
  while (exists) {
    id = generateQrCodeId();
    exists = await prisma.inventoryPurchase.findUnique({
      where: { qrCodeId: id },
    });
  }
  return id;
}

// GET /api/inventory?archived=true
export async function GET(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get("archived") === "true";

  const purchases = await prisma.inventoryPurchase.findMany({
    where: {
      userId,
      archivedAt: showArchived ? { not: null } : null,
    },
    include: { item: true, supplier: true },
    orderBy: { boughtAt: "desc" },
  });

  return NextResponse.json(purchases);
}

// POST /api/inventory
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const {
    brand,
    material,
    colorName,
    colorHex,
    globalFilamentId,
    alertThreshold,
    existingItemId,
    supplierId,
    initialWeight,
    tareWeight = 0,
    priceCents,
    boughtAt,
    quantity = 1,
    notes,
  } = await req.json();

  if (!brand || !material || !colorName) {
    return NextResponse.json(
      { error: "Marca, material e cor são obrigatórios" },
      { status: 400 },
    );
  }

  if (!initialWeight || !priceCents) {
    return NextResponse.json(
      { error: "Peso e preço são obrigatórios" },
      { status: 400 },
    );
  }

  const qty = Math.min(100, Math.max(1, Number(quantity)));

  // Verifica ou cria o InventoryItem
  let itemId = existingItemId;

  if (!itemId) {
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        userId,
        brand: { equals: brand, mode: "insensitive" },
        material: { equals: material, mode: "insensitive" },
        colorName: { equals: colorName, mode: "insensitive" },
      },
    });

    if (existing) {
      itemId = existing.id;
    } else {
      const newItem = await prisma.inventoryItem.create({
        data: {
          userId,
          brand,
          material,
          colorName,
          colorHex: colorHex ?? "#3b82f6",
          globalFilamentId: globalFilamentId ?? null,
          alertThreshold: alertThreshold ? Number(alertThreshold) : null,
        },
      });
      itemId = newItem.id;
    }
  }

  // Cria as compras
  const purchasesData = await Promise.all(
    Array.from({ length: qty }).map(async () => ({
      userId,
      itemId,
      supplierId: supplierId ?? null,
      qrCodeId: await uniqueQrCodeId(),
      initialWeight: Number(initialWeight),
      currentWeight: Number(initialWeight),
      tareWeight: Number(tareWeight),
      priceCents: Number(priceCents),
      boughtAt: boughtAt ? new Date(boughtAt) : new Date(),
      notes: notes?.trim() || null,
    })),
  );

  await prisma.inventoryPurchase.createMany({ data: purchasesData });

  const created = await prisma.inventoryPurchase.findMany({
    where: { userId, itemId, priceCents: Number(priceCents), archivedAt: null },
    include: { item: true, supplier: true },
    orderBy: { createdAt: "desc" },
    take: qty,
  });

  return NextResponse.json(created, { status: 201 });
}
