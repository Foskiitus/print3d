import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob"; // Importamos o Vercel Blob

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId");
    const printerId = formData.get("printerId");
    const printTimeMinutes = formData.get("printTimeMinutes");
    const baseCost = formData.get("baseCost");
    const recommendedPrice = formData.get("recommendedPrice");
    const usagesRaw = formData.get("usages") as string;
    const file = formData.get("file") as File | null;

    let fileUrl = null;

    // MAGIA DO VERCEL BLOB AQUI
    if (file) {
      // O 'put' faz o upload direto para a cloud da Vercel
      // O access: 'public' significa que o ficheiro pode ser descarregado
      const blob = await put(`produtos/${file.name}`, file, {
        access: "public",
      });

      fileUrl = blob.url; // Guardamos o URL permanente que a Vercel nos dá
    }

    // Gravamos na base de dados
    const product = await prisma.product.create({
      data: {
        name,
        categoryId: categoryId ? Number(categoryId) : null,
        printerId: Number(printerId),
        printTime: Number(printTimeMinutes),
        basePrice: Number(baseCost),
        suggestedPrice: Number(recommendedPrice),
        fileUrl: fileUrl, // Aqui vai o URL do Blob (ex: https://m5...blob.vercel-storage.com/...)

        filamentUsage: {
          create: JSON.parse(usagesRaw).map((u: any) => ({
            filamentTypeId: Number(u.filamentTypeId),
            weight: Number(u.weight),
          })),
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao guardar produto:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
