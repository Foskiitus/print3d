import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/printers
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const printers = await prisma.printer.findMany({
    where: { userId },
    include: {
      preset: true,
      units: {
        include: {
          unitPreset: true,
          slots: {
            include: { currentSpool: { include: { item: true } } },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      maintenanceLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(printers);
}

// POST /api/printers
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const { name, presetId, hourlyCost, powerWatts, accessories } =
      await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }
    if (!presetId) {
      return NextResponse.json(
        { error: "Modelo é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar que o preset existe
    const preset = await prisma.printerPreset.findFirst({
      where: { id: presetId, OR: [{ isGlobal: true }, { userId }] },
    });
    if (!preset) {
      return NextResponse.json(
        { error: "Modelo não encontrado" },
        { status: 404 },
      );
    }

    // Gerar qrCodeId único
    const qrCodeId = `PRN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const printer = await prisma.printer.create({
      data: {
        userId,
        presetId,
        name: name.trim(),
        qrCodeId,
        hourlyCost: Number(hourlyCost) || preset.hourlyCost,
        powerWatts: Number(powerWatts) || preset.powerWatts,
        status: "idle",
        // Criar unidades (AMS/acessórios) e os seus slots
        units: accessories?.length
          ? {
              create: accessories.map(
                (a: { presetId: string; name: string; slotCount: number }) => ({
                  presetId: a.presetId || null,
                  name: a.name,
                  slotCount: a.slotCount,
                  // Criar slots para esta unidade
                  slots: {
                    create: Array.from({ length: a.slotCount }, (_, i) => ({
                      position: i,
                    })),
                  },
                }),
              ),
            }
          : undefined,
      },
      include: {
        preset: true,
        units: {
          include: {
            slots: true,
          },
        },
      },
    });

    return NextResponse.json(printer, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/printers]", err);
    return NextResponse.json(
      { error: "Falha ao criar impressora", details: err.message },
      { status: 500 },
    );
  }
}
