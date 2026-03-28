import { NextRequest, NextResponse } from "next/server";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/printers/[id]/active-job
// Devolve o PrintJob ativo (status "printing" ou "pending") desta impressora,
// com todos os campos necessários para o endpoint PATCH /print-jobs/[id]/complete.

export async function GET(req: NextRequest, { params }: Params) {
  const userId = await requirePageAuth();
  const { id: printerId } = await params;

  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    select: { id: true },
  });
  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  const job = await prisma.printJob.findFirst({
    where: {
      printerId,
      userId,
      status: { in: ["printing", "pending"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      quantity: true,
      estimatedMinutes: true,
      startedAt: true,
      createdAt: true,
      orderId: true,
      // jobItemId necessário para o PATCH /complete
      items: {
        select: {
          id: true, // ← este é o jobItemId
          quantity: true,
          component: { select: { name: true } },
        },
      },
      // materialId necessário para o PATCH /complete
      materials: {
        select: {
          id: true, // ← este é o materialId
          material: true,
          estimatedG: true,
          colorName: true,
          colorHex: true,
        },
      },
    },
  });

  return NextResponse.json({ job: job ?? null });
}
