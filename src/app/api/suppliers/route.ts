import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

// GET /api/suppliers
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const suppliers = await prisma.supplier.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(suppliers);
}

// POST /api/suppliers
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { name, url, notes } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      userId,
      name: name.trim(),
      url: url?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}
