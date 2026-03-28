import { getAuthUserId } from "@/lib/auth";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma"; // Não te esqueças de importar o Prisma
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const MAX_IMAGE_MB = 10;
const DEFAULT_3MF_LIMIT_MB = 100;

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 1. Recebemos o fileSize do frontend
    const {
      fileName,
      contentType,
      fileSize,
      bucket = "images",
    } = await req.json();

    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "Dados em falta (nome, tipo ou tamanho)" },
        { status: 400 },
      );
    }

    // 2. Validação para Imagens
    if (bucket === "images" && fileSize > MAX_IMAGE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Imagem demasiado grande. Limite: ${MAX_IMAGE_MB} MB` },
        { status: 400 },
      );
    }

    // 3. Validação para Modelos (3MF/STL) com limite da Base de Dados
    if (bucket === "models" || bucket === "3mf") {
      const limitSetting = await prisma.settings.findUnique({
        where: {
          userId_key: { userId: userId, key: "uploadLimitMb" },
        },
      });

      const limitMb = limitSetting
        ? Number(limitSetting.value)
        : DEFAULT_3MF_LIMIT_MB;

      if (fileSize > limitMb * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Ficheiro demasiado grande. O teu limite configurado é ${limitMb} MB.`,
          },
          { status: 400 },
        );
      }
    }

    // 4. Se passou nos limites, gera a URL assinada
    const key = `${userId}/${Date.now()}-${fileName}`;
    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 },
    );

    return NextResponse.json({ url, key });
  } catch (error: any) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL de upload", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { fileKey } = await req.json();

    if (!fileKey)
      return NextResponse.json(
        { error: "fileKey obrigatório" },
        { status: 400 },
      );

    // Garantir que a key pertence ao utilizador — nunca apagar ficheiros alheios
    if (!fileKey.startsWith(`${userId}/`))
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

    // Determinar o bucket pelo tipo de ficheiro
    const ext = fileKey.toLowerCase();
    const bucket =
      ext.endsWith(".3mf") || ext.endsWith(".gcode") || ext.endsWith(".bgcode")
        ? "models"
        : "images";

    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }));

    return NextResponse.json({ success: true, fileKey });
  } catch (err: any) {
    console.error("[DELETE /api/upload/delete]", err);
    return NextResponse.json(
      { error: "Falha ao apagar ficheiro", details: err.message },
      { status: 500 },
    );
  }
}
