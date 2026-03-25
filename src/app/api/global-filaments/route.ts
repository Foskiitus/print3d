import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserIsAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Segurança: Garantir que apenas admins podem criar filamentos globais
    const isAdmin = await getAuthUserIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();
    const { brand, material, colorName, colorCode } = body;

    const filament = await prisma.globalFilament.create({
      data: {
        brand,
        material,
        colorName,
        colorCode,
      },
    });

    return NextResponse.json(filament);
  } catch (error) {
    console.error("[GLOBAL_FILAMENT_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
