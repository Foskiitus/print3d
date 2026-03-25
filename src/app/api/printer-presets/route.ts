import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, getAuthUserIsAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    const isAdmin = await getAuthUserIsAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = (await req.json()) as {
      userId: string;
      brand: string;
      model: string;
      name: string; // Adicionado
      powerWatts: number; // Adicionado
      hourlyCost: number; // Adicionado
    };
    const { brand, model, name, powerWatts, hourlyCost } = body;

    const preset = await prisma.printerPreset.create({
      data: {
        userId,
        brand,
        model,
        name, // Agora o Prisma fica satisfeito
        powerWatts,
        hourlyCost,
      },
    });

    return NextResponse.json(preset);
  } catch (error) {
    console.error("[PRINTER_PRESET_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
