// src/app/api/production/jobs/route.ts
//
// POST /api/production/jobs
//
// Cria PrintJob(s) a partir do Planeador de Mesas.
//
// Se o perfil tiver múltiplas placas (ProfilePlate), cria um PrintJob
// por placa — cada um com plateNumber e totalPlates definidos.
// Se só houver uma placa (ou nenhuma), comportamento anterior: 1 job.
//
// Body:
//   {
//     orderId:          string
//     printerId:        string
//     componentId:      string
//     profileId:        string | null
//     quantity:         number         — peças totais
//     estimatedMinutes: number | null  — tempo total, calculado no frontend
//     recipe:           "single" | "full"
//   }
//
// Resposta: job único (objeto) ou array de jobs se multi-placa

import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const body = (await req.json()) as {
    orderId: string;
    printerId: string;
    componentId: string;
    profileId: string | null;
    quantity: number;
    estimatedMinutes?: number | null;
    recipe?: "single" | "full";
  };

  const {
    orderId,
    printerId,
    componentId,
    profileId,
    quantity,
    estimatedMinutes: estimatedMinutesFromClient,
  } = body;

  // ── Validação básica ──────────────────────────────────────────────────────
  if (!orderId || !printerId || !componentId || !quantity || quantity < 1) {
    return NextResponse.json(
      { error: "orderId, printerId, componentId e quantity são obrigatórios" },
      { status: 400 },
    );
  }

  // ── Verificar OP ──────────────────────────────────────────────────────────
  const order = await prisma.productionOrder.findFirst({
    where: { id: orderId, userId },
    select: { id: true, status: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: "Ordem de produção não encontrada" },
      { status: 404 },
    );
  }
  if (["done", "cancelled"].includes(order.status)) {
    return NextResponse.json(
      { error: `Não é possível lançar um job numa OP "${order.status}"` },
      { status: 400 },
    );
  }

  // ── Verificar impressora ──────────────────────────────────────────────────
  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
    select: { id: true },
  });
  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  // ── Verificar componente ──────────────────────────────────────────────────
  const component = await prisma.component.findFirst({
    where: { id: componentId, userId },
    select: { id: true },
  });
  if (!component) {
    return NextResponse.json(
      { error: "Componente não encontrado" },
      { status: 404 },
    );
  }

  // ── Carregar perfil e placas ──────────────────────────────────────────────
  type PlateSpec = {
    plateNumber: number;
    name: string | null;
    printTime: number | null;
    batchSize: number;
  };

  let plates: PlateSpec[] = [];

  if (profileId) {
    const profile = await prisma.componentPrintProfile.findFirst({
      where: { id: profileId, component: { userId } },
      select: {
        printTime: true,
        batchSize: true,
        plates: {
          orderBy: { plateNumber: "asc" },
          select: {
            plateNumber: true,
            name: true,
            printTime: true,
            batchSize: true,
          },
        },
      },
    });

    if (profile) {
      if (profile.plates.length > 0) {
        plates = profile.plates;
      } else {
        // Placa única — campos do próprio perfil como fallback
        plates = [
          {
            plateNumber: 1,
            name: null,
            printTime: profile.printTime ?? null,
            batchSize: profile.batchSize,
          },
        ];
      }
    }
  }

  if (plates.length === 0) {
    plates = [{ plateNumber: 1, name: null, printTime: null, batchSize: 1 }];
  }

  const totalPlates = plates.length;
  const totalProfileMinutes = plates.reduce(
    (s, p) => s + (p.printTime ?? 0),
    0,
  );

  // ── Criar jobs em transação ───────────────────────────────────────────────
  const jobs = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const plate of plates) {
      // Tempo desta placa: proporcional ao estimado pelo frontend,
      // ou o printTime da placa, ou null
      let plateMinutes: number | null = null;
      if (
        estimatedMinutesFromClient != null &&
        estimatedMinutesFromClient > 0 &&
        totalProfileMinutes > 0
      ) {
        const fraction = (plate.printTime ?? 0) / totalProfileMinutes;
        plateMinutes =
          Math.round(estimatedMinutesFromClient * fraction) || null;
      } else if (plate.printTime != null) {
        plateMinutes = plate.printTime;
      }

      const job = await tx.printJob.create({
        data: {
          userId,
          status: "pending",
          orderId,
          printerId,
          estimatedMinutes: plateMinutes,
          quantity: plate.batchSize,
          plateNumber: plate.plateNumber,
          totalPlates,
          notes: plate.name
            ? `Mesa ${plate.plateNumber}: ${plate.name}`
            : totalPlates > 1
              ? `Mesa ${plate.plateNumber} de ${totalPlates}`
              : null,
          items: {
            create: [
              {
                componentId,
                profileId: profileId ?? null,
                quantity: plate.batchSize,
              },
            ],
          },
        },
        include: {
          printer: { select: { id: true, name: true, status: true } },
          items: {
            include: { component: { select: { id: true, name: true } } },
          },
          order: { select: { id: true, status: true } },
        },
      });

      created.push(job);
    }

    // Avançar OP para in_progress
    if (["draft", "pending"].includes(order.status)) {
      await tx.productionOrder.update({
        where: { id: orderId },
        data: { status: "in_progress" },
      });
    }

    // Marcar impressora como printing
    await tx.printer.update({
      where: { id: printerId },
      data: { status: "printing" },
    });

    return created;
  });

  // Retrocompatibilidade: 1 job → objeto; N jobs → array
  return NextResponse.json(jobs.length === 1 ? jobs[0] : jobs, {
    status: 201,
  });
}
