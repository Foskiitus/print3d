import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    where: { userId: userId },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}
