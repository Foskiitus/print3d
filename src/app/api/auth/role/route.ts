import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true },
  });

  return NextResponse.json({
    role: user?.role ?? "user",
    plan: user?.plan ?? "hobby",
  });
}
