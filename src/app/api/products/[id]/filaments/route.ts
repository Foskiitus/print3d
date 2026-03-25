import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { filamentTypeId, weight } = await req.json();

  // const usage = await prisma.productFilamentUsage.create({
  //   data: {
  //     productId: id,
  //     filamentTypeId: String(filamentTypeId),
  //     weight: Number(weight),
  //   },
  // });

  const usage = [] as any[];
  return NextResponse.json(usage);
}
