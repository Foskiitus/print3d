import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

// PATCH /api/inventory/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const purchase = await prisma.inventoryPurchase.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof body.currentWeight === "number") {
    updateData.currentWeight = body.currentWeight;
  }

  if (body.openedAt !== undefined) {
    updateData.openedAt = body.openedAt ? new Date(body.openedAt) : null;
  }

  if (body.archived === true) {
    updateData.archivedAt = new Date();
  }

  if (body.archived === false) {
    updateData.archivedAt = null;
  }

  const updated = await prisma.inventoryPurchase.update({
    where: { id },
    data: updateData,
    include: { item: true, supplier: true },
  });

  return NextResponse.json(updated);
}

// GET /api/inventory/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const purchase = await prisma.inventoryPurchase.findUnique({
    where: { id },
    include: { item: true, supplier: true },
  });

  if (!purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(purchase);
}
