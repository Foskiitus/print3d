// src/app/api/components/extract/route.ts
//
// Recebe apenas a KEY do ficheiro já uploaded para o R2,
// descarrega-o internamente para extrair metadados,
// e devolve os dados ao cliente.
// O ficheiro já foi enviado para o R2 directamente pelo cliente
// via presigned URL (gerada por /api/upload).

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    // Descarregar do R2 e tentar extrair o máximo possível.
    // O extractor preenche o que conseguir — mesas, cores, materiais,
    // tempo e gramas se o ficheiro estiver fatiado. O que ficar vazio
    // o utilizador preenche manualmente no modal.
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { r2 } = await import("@/lib/r2");
      const { extractFrom3mf } = await import("@/lib/preflight/extractor");

      const obj = await r2.send(
        new GetObjectCommand({ Bucket: "models", Key: fileKey }),
      );
      const buffer = Buffer.from(await obj.Body!.transformToByteArray());
      const result = await extractFrom3mf(buffer);

      return NextResponse.json({ ...result, filePath: fileKey });
    } catch (extractErr: any) {
      console.error("[extract]", extractErr?.message ?? extractErr);
      // Mesmo em erro, devolver o filePath para o modal guardar o ficheiro
      return NextResponse.json({
        source: "manual_required",
        filePath: fileKey,
        message:
          "Ficheiro guardado. Não foi possível extrair metadados — preenche manualmente.",
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
