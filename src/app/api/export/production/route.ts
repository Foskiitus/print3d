import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const logs = await prisma.productionLog.findMany({
    where: { userId: session.user.id },
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
