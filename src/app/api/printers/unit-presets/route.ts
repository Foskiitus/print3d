// src/app/api/printers/unit-presets/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── GET /api/printers/unit-presets ──────────────────────────────────────────

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const presets = await prisma.unitPreset.findMany({
    where: { isGlobal: true },
    orderBy: [{ brand: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(presets);
}
