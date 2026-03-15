import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const sales = await prisma.sale.findMany({
    where: { userId: session.user.id },
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
