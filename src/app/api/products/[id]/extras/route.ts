import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { extraId, quantity } = await req.json();

  const usage = await prisma.productExtra.create({
    data: {
      productId: Number(id),
      extraId: Number(extraId),
      quantity: Number(quantity),
    },
  });
  return NextResponse.json(usage);
}

export async function DELETE(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId");
  await prisma.productExtra.delete({ where: { id: Number(itemId) } });
  return NextResponse.json({ ok: true });
}
