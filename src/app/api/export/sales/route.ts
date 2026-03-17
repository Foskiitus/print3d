import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sales = await prisma.sale.findMany({
    where: { userId: userId },
    include: { product: true, customer: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(
    sales.map((s) => ({
      ...s,
      date: s.date.toISOString(),
    })),
  );
}
