// src/app/api/components/extract/route.ts
//
// Recebe apenas a KEY do ficheiro já uploaded para o R2,
// descarrega-o internamente para extrair metadados,
// e devolve os dados ao cliente.
// O ficheiro já foi enviado para o R2 directamente pelo cliente
// via presigned URL (gerada por /api/upload).

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2"; // cliente partilhado — usa as mesmas env vars que /api/upload
import { extractFrom3mf } from "@/lib/preflight/extractor";

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { fileKey } = await req.json();

    if (!fileKey)
      return NextResponse.json(
        { error: "fileKey não fornecido" },
        { status: 400 },
      );

    // Validar que a key pertence ao utilizador autenticado
    // O /api/upload gera keys no formato: {userId}/{timestamp}-{fileName}
    if (!fileKey.startsWith(`${userId}/`))
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

    const ext = fileKey.toLowerCase().slice(fileKey.lastIndexOf("."));
    const allowed = [".3mf", ".gcode", ".bgcode"];
    if (!allowed.includes(ext))
      return NextResponse.json(
        { error: "Formato não suportado" },
        { status: 400 },
      );

    // Ficheiros que não são .3mf não têm metadados extraíveis
    if (ext !== ".3mf") {
      return NextResponse.json({
        source: "manual_required",
        message: "Ficheiro carregado. Preenche manualmente o peso e o tempo.",
        filePath: fileKey,
      });
    }

    // ── Descarregar do R2 para extrair metadados ──────────────────────────────
    try {
      const obj = await r2.send(
        new GetObjectCommand({
          Bucket: "models", // mesmo bucket que /api/upload usa para ficheiros 3mf
          Key: fileKey,
        }),
      );

      const buffer = Buffer.from(await obj.Body!.transformToByteArray());
      const filaments = await extractFrom3mf(buffer);
      const totalG = filaments.reduce((acc, f) => acc + f.estimatedG, 0);

      // Se extraiu filamentos mas sem gramas (ficheiro não fatiado),
      // devolve source "3mf_no_weight" — o modal pré-preenche cores
      // e pede ao utilizador apenas as gramas e o tempo
      if (filaments.length > 0 && totalG === 0) {
        return NextResponse.json({
          source: "3mf_no_weight",
          filePath: fileKey,
          filamentUsed: null,
          printTime: null,
          filaments,
          message: "Cores extraídas. Indica o peso e o tempo de impressão.",
        });
      }

      return NextResponse.json({
        source: "3mf",
        filePath: fileKey,
        filamentUsed: totalG > 0 ? Math.round(totalG) : null,
        printTime: null,
        filaments,
      });
    } catch (extractErr: any) {
      console.error(
        "[extract] erro ao descarregar/extrair:",
        extractErr?.message ?? extractErr,
      );
      return NextResponse.json({
        source: "manual_required",
        message: "Ficheiro carregado mas não foi possível extrair metadados.",
        filePath: fileKey,
      });
    }
  } catch (error: any) {
    console.error("[POST /api/components/extract]", error);
    return NextResponse.json(
      { error: "Falha ao processar ficheiro", details: error.message },
      { status: 500 },
    );
  }
}
