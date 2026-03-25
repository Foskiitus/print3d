import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/extras
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const extras = await prisma.extra.findMany({
    where: { userId },
    include: { _count: { select: { usages: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(extras);
}

// POST /api/extras
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const {
      name,
      description,
      price,
      unit,
      category,
      quantity,
      alertThreshold,
    } = await req.json();

    if (!name?.trim() || price === undefined) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 },
      );
    }

    const extra = await prisma.extra.create({
      data: {
        userId,
        name: name.trim(),
        description: description || null,
        price: Number(price),
        unit: unit || null,
        category: category || "hardware",
        quantity: Number(quantity) || 0,
        alertThreshold: alertThreshold ? Number(alertThreshold) : null,
      },
    });

    return NextResponse.json(extra, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/extras]", error);
    return NextResponse.json(
      { error: "Falha ao criar extra", details: error.message },
      { status: 500 },
    );
  }
}
