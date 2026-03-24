// src/app/api/printers/[id]/preflight/analyze/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { matchMaterials } from "@/lib/preflight/matcher";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: printerId } = await params;

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

    let requiredMaterials: {
      material: string;
      colorHex: string | null;
      colorName: string | null;
      estimatedG: number;
    }[] = [];

    if (body.profileId) {
      // Procurar em ComponentPrintProfile (novo sistema BOM)
      const profile = await prisma.componentPrintProfile.findFirst({
        where: { id: body.profileId },
        include: {
          filaments: true,
          component: { select: { userId: true } },
        },
      });

      // Verificar que pertence ao utilizador
      if (!profile || profile.component.userId !== userId)
        return NextResponse.json(
          { error: "Perfil não encontrado" },
          { status: 404 },
        );

      if (profile.filaments.length === 0) {
        // Perfil sem filamentos definidos — pedir inserção manual
        return NextResponse.json({
          source: "manual_required",
          message:
            "Este perfil não tem materiais definidos. Por favor insere manualmente.",
          profile: {
            id: profile.id,
            name: profile.name,
            printTime: profile.printTime,
          },
        });
      }

      requiredMaterials = profile.filaments.map((f) => ({
        material: f.material,
        colorHex: f.colorHex,
        colorName: f.colorName,
        estimatedG: f.estimatedG,
      }));
    } else if (body.materials && Array.isArray(body.materials)) {
      requiredMaterials = body.materials;
    } else {
      return NextResponse.json(
        { error: "Fornece profileId ou materials" },
        { status: 400 },
      );
    }

    if (requiredMaterials.length === 0) {
      return NextResponse.json({
        source: "manual_required",
        message: "Sem materiais para analisar. Por favor insere manualmente.",
      });
    }

    const matchResult = matchMaterials(requiredMaterials, printer.units);

    return NextResponse.json({
      source: body.profileId ? "profile" : "manual",
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
