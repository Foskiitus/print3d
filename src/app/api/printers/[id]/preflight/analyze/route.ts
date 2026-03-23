// src/app/api/printers/[id]/preflight/analyze/route.ts
//
// Analisa os materiais necessários para uma impressão.
// Pode receber:
//   A) profileId → lê o ficheiro .3mf e extrai materiais
//   B) materials → array inserido manualmente pelo utilizador
//
// Devolve os materiais necessários + o resultado do matching com os slots.

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { matchMaterials } from "@/lib/preflight/matcher";
import { extractFrom3mf } from "@/lib/preflight/extractor";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: printerId } = await params;

  // Carregar impressora com slots e rolos carregados
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    include: {
      units: {
        include: {
          slots: {
            include: {
              currentSpool: { include: { item: true } },
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  try {
    const body = await req.json();
    // body.profileId → analisar .3mf
    // body.materials → array manual [{ material, colorHex, colorName, estimatedG }]
    // body.productId → opcional, para associar ao job

    let requiredMaterials: {
      material: string;
      colorHex: string | null;
      colorName: string | null;
      estimatedG: number;
    }[] = [];

    if (body.profileId) {
      // Tentar extrair do .3mf
      const profile = await prisma.printProfile.findFirst({
        where: { id: body.profileId, userId },
      });
      if (!profile)
        return NextResponse.json(
          { error: "Perfil não encontrado" },
          { status: 404 },
        );

      try {
        requiredMaterials = await extractFrom3mf(profile.filePath);
      } catch {
        // Se falhar a leitura do .3mf, devolver indicação para inserir manualmente
        return NextResponse.json({
          source: "manual_required",
          message:
            "Não foi possível extrair materiais do ficheiro .3mf. Por favor insere manualmente.",
          profile: {
            id: profile.id,
            name: profile.name,
            printTime: profile.printTime,
          },
        });
      }
    } else if (body.materials && Array.isArray(body.materials)) {
      requiredMaterials = body.materials;
    } else {
      return NextResponse.json(
        { error: "Fornece profileId ou materials" },
        { status: 400 },
      );
    }

    // Correr o algoritmo de matching
    const matchResult = matchMaterials(requiredMaterials, printer.units);

    return NextResponse.json({
      source: body.profileId ? "3mf" : "manual",
      printerId,
      productId: body.productId ?? null,
      profileId: body.profileId ?? null,
      estimatedMinutes: body.estimatedMinutes ?? null,
      quantity: body.quantity ?? 1,
      requiredMaterials,
      matchResult,
    });
  } catch (error: any) {
    console.error("[POST /api/printers/[id]/preflight/analyze]", error);
    return NextResponse.json(
      { error: "Falha na análise", details: error.message },
      { status: 500 },
    );
  }
}
