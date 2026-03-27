// src/app/api/production/jobs/route.ts
//
// POST /api/production/jobs
//
// Cria um novo PrintJob a partir do Planeador de Mesas.
//
// Body:
//   {
//     orderId:          string
//     printerId:        string
//     componentId:      string
//     profileId:        string | null
//     quantity:         number        — peças totais (plates × batchSize)
//     estimatedMinutes: number | null — tempo total (printTime × plates), calculado no frontend
//     recipe:           "single" | "full"
//   }
//
// Efeitos:
//   1. Cria PrintJob { status: "pending" } + PrintJobItem com profileId
//   2. Avança ProductionOrder → "in_progress" (se ainda em draft/pending)
//   3. Marca Printer.status = "printing"

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
    estimatedMinutes?: number | null; // calculado no frontend com a matemática correta
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

  // ── Verificar que a OP pertence ao utilizador ─────────────────────────────
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

  // ── Verificar que a impressora pertence ao utilizador ─────────────────────
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

  // ── Verificar que o componente pertence ao utilizador ─────────────────────
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

  // ── Obter tempo estimado ──────────────────────────────────────────────────
  // Preferir o valor calculado no frontend (já tem plates × printTime correto).
  // Fallback: calcular a partir do perfil se o frontend não enviou.
  let estimatedMinutes: number | null = estimatedMinutesFromClient ?? null;
  if (estimatedMinutes === null && profileId) {
    const profile = await prisma.componentPrintProfile.findFirst({
      where: {
        id: profileId,
        component: { userId },
      },
      select: { printTime: true, batchSize: true },
    });
    if (profile?.printTime) {
      // Fallback seguro: 1 placa (o frontend devia sempre enviar estimatedMinutes)
      estimatedMinutes = profile.printTime;
    }
  }

  // ── Criar job + avançar OP + atualizar impressora (transação atómica) ─────
  const job = await prisma.$transaction(async (tx) => {
    // 1. Criar o PrintJob
    // "pending" = planeado, não confirmado como em execução física.
    // O utilizador confirma no OrderCard → status passa a "printing".
    const newJob = await tx.printJob.create({
      data: {
        userId,
        status: "pending",
        orderId,
        printerId,
        estimatedMinutes,
        quantity,
        items: {
          create: [
            {
              componentId,
              profileId: profileId ?? null,
              quantity,
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

    // 2. Avançar a OP para "in_progress" se ainda estava em draft/pending
    if (["draft", "pending"].includes(order.status)) {
      await tx.productionOrder.update({
        where: { id: orderId },
        data: { status: "in_progress" },
      });
    }

    // 3. Marcar a impressora como "printing"
    await tx.printer.update({
      where: { id: printerId },
      data: { status: "printing" },
    });

    return newJob;
  });

  return NextResponse.json(job, { status: 201 });
}
