import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth";

// GET /api/users — lista utilizadores (apenas admin)
export async function GET() {
  const { userId, error } = await requireApiAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(users);
}

// POST removido — utilizadores são criados via Clerk
// O webhook em /api/webhooks/clerk sincroniza automaticamente com a base de dados
