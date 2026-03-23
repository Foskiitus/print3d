import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid"; // npm install nanoid

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Gera um ID curto e legível para QR/NFC: ex. "PRN-X7K2M9" */
function generateQrCodeId(): string {
  return `PRN-${nanoid(6).toUpperCase()}`;
}

/** Calcula as horas totais acumuladas da impressora (initialHours + totalPrintTime) */
function totalHours(printer: { initialHours: number; totalPrintTime: number }) {
  return printer.initialHours + Math.floor(printer.totalPrintTime / 60);
}

// ─── GET /api/printers ───────────────────────────────────────────────────────

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const printers = await prisma.printer.findMany({
    where: { userId },
    include: {
      preset: {
        include: { maintenanceTasks: true },
      },
      units: {
        include: {
          slots: {
            include: {
              currentSpool: {
                include: { item: true },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      },
      maintenanceLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });

  // Enriquecer com campos calculados
  const enriched = printers.map((p) => {
    const hoursTotal = totalHours(p);

    const maintenanceStatus =
      p.preset?.maintenanceTasks.map((task) => {
        const hoursSinceLast = hoursTotal - p.lastMaintenanceAt;
        const progress = Math.min(
          Math.round((hoursSinceLast / task.intervalHours) * 100),
          100,
        );
        return {
          taskName: task.taskName,
          intervalHours: task.intervalHours,
          hoursSinceLast,
          progress,
          isDue: progress >= 100,
        };
      }) ?? [];

    const allSlots = p.units.flatMap((u) => u.slots);
    const totalSlots = allSlots.length || 1;
    const loadedSlots = allSlots.filter((s) => s.currentSpool !== null).length;
    const currentSpool =
      allSlots.find((s) => s.currentSpool !== null)?.currentSpool ?? null;

    return {
      ...p,
      totalHours: hoursTotal,
      maintenanceStatus,
      totalSlots,
      loadedSlots,
      currentSpool,
    };
  });

  return NextResponse.json(enriched);
}

// ─── POST /api/printers ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const {
      name,
      hourlyCost,
      powerWatts,
      presetId,
      acquiredAt,
      initialHours,
      units = [], // [{ presetId, name, brand, slotCount, supportsHighTemp, supportsAbrasive }]
    } = await req.json();

    // Validação básica
    if (
      !name ||
      hourlyCost === undefined ||
      powerWatts === undefined ||
      !presetId
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios em falta: name, hourlyCost, powerWatts, presetId",
        },
        { status: 400 },
      );
    }

    // Garantir que o preset existe (global ou privado do utilizador)
    const preset = await prisma.printerPreset.findFirst({
      where: {
        id: presetId,
        OR: [{ isGlobal: true }, { userId }],
      },
    });

    if (!preset) {
      return NextResponse.json(
        { error: "Preset não encontrado ou sem permissão" },
        { status: 404 },
      );
    }

    // Gerar QR único (retry em caso de colisão, improvável com nanoid)
    let qrCodeId = generateQrCodeId();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.printer.findUnique({ where: { qrCodeId } });
      if (!existing) break;
      qrCodeId = generateQrCodeId();
      attempts++;
    }

    const printer = await prisma.printer.create({
      data: {
        userId,
        presetId,
        name,
        hourlyCost: Number(hourlyCost),
        powerWatts: Number(powerWatts),
        qrCodeId,
        initialHours: Number(initialHours ?? 0),
        acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
        status: "idle",
        // Criar unidades de expansão e os respetivos slots
        units:
          units.length > 0
            ? {
                create: units.map((u: any) => ({
                  presetId: u.presetId ?? null,
                  name: u.name,
                  slotCount: Number(u.slotCount),
                  supportsHighTemp: Boolean(u.supportsHighTemp),
                  supportsAbrasive: Boolean(u.supportsAbrasive),
                  // Gerar slots automaticamente (posições 1 a slotCount)
                  slots: {
                    create: Array.from(
                      { length: Number(u.slotCount) },
                      (_, i) => ({
                        position: i + 1,
                      }),
                    ),
                  },
                })),
              }
            : undefined,
      },
      include: {
        preset: {
          include: { maintenanceTasks: true },
        },
        units: {
          include: { slots: true },
        },
      },
    });

    return NextResponse.json(
      {
        ...printer,
        totalHours: totalHours(printer),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[POST /api/printers]", error);
    return NextResponse.json(
      { error: "Falha ao criar impressora", details: error.message },
      { status: 500 },
    );
  }
}
