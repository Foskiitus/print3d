import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/settings
// Body: { settings: Record<string, string> }
// Faz upsert de cada chave para o utilizador autenticado
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const { settings } = await req.json();

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "settings é obrigatório" },
        { status: 400 },
      );
    }

    // Upsert de cada chave em paralelo
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.settings.upsert({
          where: { userId_key: { userId, key } },
          update: { value: String(value) },
          create: { userId, key, value: String(value) },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json(
      { error: "Falha ao guardar definições", details: err.message },
      { status: 500 },
    );
  }
}
