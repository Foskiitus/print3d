// src/app/api/printers/[id]/preflight/dispatch/route.ts
//
// Confirma e inicia um trabalho de impressão.
//
// Faz numa transação atómica:
//   1. Cria o PrintJob com os materiais atribuídos
//   2. Reserva o peso estimado em cada rolo (desconta currentWeight)
//   3. Muda o status da impressora para "printing"
//   4. Se a impressora tiver API configurada, envia START_PRINT

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface AssignedMaterial {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
  slotId: string | null;
  spoolId: string | null;
  matchScore: number;
}

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

  if (printer.status === "printing")
    return NextResponse.json(
      { error: "A impressora já está a imprimir" },
      { status: 409 },
    );

  try {
    const {
      productId,
      profileId,
      quantity,
      estimatedMinutes,
      notes,
      materials, // AssignedMaterial[]
    } = await req.json();

    if (!materials || materials.length === 0)
      return NextResponse.json(
        { error: "Materiais são obrigatórios" },
        { status: 400 },
      );

    // ── Transação atómica ────────────────────────────────────────────────────
    const job = await prisma.$transaction(async (tx) => {
      // 1. Criar o PrintJob
      const newJob = await tx.printJob.create({
        data: {
          userId,
          printerId,
          productId: productId ?? null,
          profileId: profileId ?? null,
          quantity: quantity ?? 1,
          estimatedMinutes: estimatedMinutes ?? null,
          notes: notes ?? null,
          status: "printing",
          startedAt: new Date(),
          materials: {
            create: materials.map((m: AssignedMaterial) => ({
              slotId: m.slotId ?? null,
              spoolId: m.spoolId ?? null,
              material: m.material,
              colorHex: m.colorHex ?? null,
              colorName: m.colorName ?? null,
              estimatedG: m.estimatedG,
              matchScore: m.matchScore ?? 100,
            })),
          },
        },
        include: {
          materials: true,
        },
      });

      // 2. Descontar peso estimado de cada rolo
      for (const m of materials as AssignedMaterial[]) {
        if (!m.spoolId || m.estimatedG <= 0) continue;

        const spool = await tx.inventoryPurchase.findUnique({
          where: { id: m.spoolId },
        });
        if (!spool) continue;

        const newWeight = Math.max(0, spool.currentWeight - m.estimatedG);
        await tx.inventoryPurchase.update({
          where: { id: m.spoolId },
          data: { currentWeight: newWeight },
        });
      }

      // 3. Mudar status da impressora para "printing"
      await tx.printer.update({
        where: { id: printerId },
        data: { status: "printing" },
      });

      return newJob;
    });

    // ── Integração externa (fora da transação — não crítica) ─────────────────
    let apiMessage: string | null = null;
    if (printer.apiType && printer.apiUrl) {
      try {
        apiMessage = await dispatchToApi(printer, profileId);
      } catch (e: any) {
        // Não falhar o job se a API externa falhar
        apiMessage = `Registo efetuado. Erro ao contactar a API da impressora: ${e.message}. Inicia o ficheiro manualmente.`;
      }
    } else {
      apiMessage =
        "Registo efetuado com sucesso! Por favor, inicia o ficheiro manualmente na impressora.";
    }

    return NextResponse.json(
      {
        job,
        apiMessage,
        apiDispatched:
          printer.apiType !== null && !apiMessage?.includes("Erro"),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[POST /api/printers/[id]/preflight/dispatch]", error);
    return NextResponse.json(
      { error: "Falha ao iniciar impressão", details: error.message },
      { status: 500 },
    );
  }
}

// ─── Dispatcher de API externa ────────────────────────────────────────────────

async function dispatchToApi(
  printer: {
    apiType: string | null;
    apiUrl: string | null;
    apiKey: string | null;
  },
  profileId: string | null,
): Promise<string> {
  if (!printer.apiUrl) throw new Error("URL da API não configurada");

  switch (printer.apiType) {
    case "octoprint": {
      // OctoPrint: POST /api/job → selecionar e imprimir ficheiro
      const res = await fetch(`${printer.apiUrl}/api/job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey ?? "",
        },
        body: JSON.stringify({ command: "start" }),
      });
      if (!res.ok) throw new Error(`OctoPrint respondeu ${res.status}`);
      return "Impressão iniciada via OctoPrint.";
    }

    case "moonraker": {
      // Moonraker (Klipper): POST /printer/print/start
      const res = await fetch(`${printer.apiUrl}/printer/print/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: profileId ?? "unknown.gcode" }),
      });
      if (!res.ok) throw new Error(`Moonraker respondeu ${res.status}`);
      return "Impressão iniciada via Moonraker/Klipper.";
    }

    case "bambu": {
      // Bambu Cloud: API proprietária — por enquanto só registo
      // (A API Bambu requer autenticação OAuth complexa)
      return "Registo efetuado. A integração Bambu Cloud requer iniciar manualmente por enquanto.";
    }

    default:
      throw new Error(`Tipo de API desconhecido: ${printer.apiType}`);
  }
}
