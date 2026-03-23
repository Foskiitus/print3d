import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/filaments/catalog?q=bambu
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const results = await prisma.globalFilament.findMany({
    where: {
      OR: [
        { brand: { contains: q, mode: "insensitive" } },
        { material: { contains: q, mode: "insensitive" } },
        { colorName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: [{ brand: "asc" }, { material: "asc" }],
  });

  return NextResponse.json(results);
}
