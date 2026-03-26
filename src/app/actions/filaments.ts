"use server"; // OBRIGATÓRIO

import { prisma } from "@/lib/prisma";

export async function getUniqueMaterials() {
  try {
    const materials = await prisma.globalFilament.findMany({
      select: {
        material: true,
      },
      distinct: ["material"],
      orderBy: {
        material: "asc",
      },
    });

    return materials.map((m) => m.material);
  } catch (error) {
    console.error("Erro ao procurar materiais:", error);
    return [];
  }
}
