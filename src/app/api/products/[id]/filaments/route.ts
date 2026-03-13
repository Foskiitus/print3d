import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { filamentTypeId, weight } = await req.json();

  const usage = await prisma.productFilamentUsage.create({
    data: {
      productId: Number(id),
      filamentTypeId: Number(filamentTypeId),
      weight: Number(weight),
    },
  });
  return NextResponse.json(usage);
}

export async function DELETE(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId");
  await prisma.productFilamentUsage.delete({ where: { id: Number(itemId) } });
  return NextResponse.json({ ok: true });
}
