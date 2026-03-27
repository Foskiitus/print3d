// src/app/api/printers/by-qr/[qrCodeId]/route.ts
//
// GET /api/printers/by-qr/[qrCodeId]
//
// Encontra uma impressora pelo seu qrCodeId (sem autenticação).
// Usado pela página /scan/printer/[qrCodeId] para redirecionar
// o utilizador para a página de detalhes da impressora correcta.
//
// Resposta:
//   { printerId: string }   →  200
//   { error: string }       →  404

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ qrCodeId: string }> },
) {
  const { qrCodeId } = await params;

  const printer = await prisma.printer.findFirst({
    where: { qrCodeId: qrCodeId.trim().toUpperCase() },
    select: { id: true, userId: true },
  });

  if (!printer) {
    return NextResponse.json(
      { error: "Impressora não encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ printerId: printer.id });
}
