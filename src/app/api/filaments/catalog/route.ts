import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/filaments/catalog?q=pla+matte+black
//
// Pesquisa por qualquer ordem de palavras:
//   "pla matte black", "matte pla", "black pla", "11101" — tudo funciona.
//
// Cada palavra da query tem de existir em pelo menos um dos campos:
//   brand, material, colorName, colorCode
// (lógica AND entre palavras, OR entre campos)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    const allResults = await prisma.globalFilament.findMany({
      // Se a tua base de dados for muito grande, pondera adicionar um 'take' aqui ou paginação
      orderBy: [{ brand: "asc" }, { material: "asc" }, { colorName: "asc" }],
    });
    return NextResponse.json(allResults);
  }

  if (q.length < 2) return NextResponse.json([]);

  // Dividir a query em palavras individuais (ignorar vazias)
  const words = q.split(/\s+/).filter((w) => w.length > 0);

  // Para cada palavra, criar uma condição OR entre todos os campos pesquisáveis
  // O resultado final é AND entre todas as palavras
  const results = await prisma.globalFilament.findMany({
    where: {
      AND: words.map((word) => ({
        OR: [
          { brand: { contains: word, mode: "insensitive" } },
          { material: { contains: word, mode: "insensitive" } },
          { colorName: { contains: word, mode: "insensitive" } },
          { colorCode: { contains: word, mode: "insensitive" } },
        ],
      })),
    },
    take: 20,
    orderBy: [{ brand: "asc" }, { material: "asc" }, { colorName: "asc" }],
  });

  return NextResponse.json(results);
}
