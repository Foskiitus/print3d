import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/settings?key=electricityPrice
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key) {
    const setting = await prisma.settings.findUnique({
      where: { userId_key: { userId: session.user.id, key } },
    });
    return NextResponse.json({ key, value: setting?.value ?? null });
  }

  const settings = await prisma.settings.findMany({
    where: { userId: session.user.id },
  });
  return NextResponse.json(settings);
}

// POST /api/settings  { key, value }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Key é obrigatória" }, { status: 400 });
    }

    const setting = await prisma.settings.upsert({
      where: { userId_key: { userId: session.user.id, key } },
      update: { value: String(value) },
      create: { userId: session.user.id, key, value: String(value) },
    });

    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("[POST /api/settings]", error);
    return NextResponse.json(
      { error: "Erro ao guardar configuração", details: error.message },
      { status: 500 },
    );
  }
}
