import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}
