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
    include: { item: true, supplier: true, loadedInSlot: true },
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
    include: { item: true, supplier: true, loadedInSlot: true },
  });

  if (!purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(purchase);
}

// DELETE /api/inventory/[id]
// Regra: só permite apagar bobines sem gastos.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const purchase = await prisma.inventoryPurchase.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      initialWeight: true,
      currentWeight: true,
      loadedInSlot: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasSpentByWeight = purchase.currentWeight < purchase.initialWeight;
  const isInSlot = Boolean(purchase.loadedInSlot);
  const usageLogsCount = await prisma.printJobMaterial.count({
    where: {
      spoolId: id,
      actualG: { gt: 0 },
    },
  });
  const hasSpentByLogs = usageLogsCount > 0;

  if (isInSlot) {
    return NextResponse.json(
      {
        error:
          "Esta bobine está atualmente carregada num slot e não pode ser eliminada.",
      },
      { status: 409 },
    );
  }

  if (hasSpentByWeight || hasSpentByLogs) {
    return NextResponse.json(
      {
        error: "Esta bobine já tem gastos registados e não pode ser eliminada.",
      },
      { status: 409 },
    );
  }

  await prisma.inventoryPurchase.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
