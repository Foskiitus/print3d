import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const logs = await prisma.productionLog.findMany({
    where: { userId: userId },
    include: { product: true, printer: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(
    logs.map((l) => ({
      ...l,
      date: l.date.toISOString(),
    })),
  );
}
