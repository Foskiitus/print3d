// src/app/api/printers/[id]/maintenance/route.ts

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─── POST /api/printers/[id]/maintenance ─────────────────────────────────────
// Regista uma tarefa de manutenção como feita.
// Cria um MaintenanceLog para esta tarefa específica.
// NÃO atualiza lastMaintenanceAt — esse campo é global e não representa
// o estado de tarefas individuais. O progresso de cada tarefa é calculado
// a partir do seu último MaintenanceLog.

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
  });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  try {
    const { taskId } = await req.json();
    if (!taskId)
      return NextResponse.json(
        { error: "taskId é obrigatório" },
        { status: 400 },
      );

    // Verificar que a tarefa pertence ao preset desta impressora
    const task = await prisma.maintenanceTask.findFirst({
      where: { id: taskId, presetId: printer.presetId },
    });
    if (!task)
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 },
      );

    const currentHours =
      printer.initialHours + Math.floor(printer.totalPrintTime / 60);

    // Criar apenas o log — sem tocar em lastMaintenanceAt
    const log = await prisma.maintenanceLog.create({
      data: {
        printerId,
        taskName: task.taskName,
        performedAtHours: currentHours,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/printers/[id]/maintenance]", error);
    return NextResponse.json(
      { error: "Falha ao registar manutenção", details: error.message },
      { status: 500 },
    );
  }
}

// ─── GET /api/printers/[id]/maintenance ──────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: printerId } = await params;

  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId },
  });
  if (!printer)
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );

  const logs = await prisma.maintenanceLog.findMany({
    where: { printerId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
