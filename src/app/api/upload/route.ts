import { auth } from "@/lib/auth";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const MAX_IMAGE_MB = 10;
const DEFAULT_3MF_LIMIT_MB = 100;

// POST /api/upload
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "image" | "3mf"

    if (!file) {
      return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
    }

    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Ficheiro deve ser uma imagem" },
          { status: 400 },
        );
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Imagem demasiado grande. Limite: ${MAX_IMAGE_MB} MB` },
          { status: 400 },
        );
      }
    }

    if (type === "3mf") {
      if (!file.name.endsWith(".3mf") && !file.name.endsWith(".stl")) {
        return NextResponse.json(
          { error: "Ficheiro deve ser .3mf ou .stl" },
          { status: 400 },
        );
      }

      // Ler limite configurado pelo utilizador nas definições
      const limitSetting = await prisma.settings.findUnique({
        where: {
          userId_key: { userId: session.user.id, key: "uploadLimitMb" },
        },
      });
      const limitMb = limitSetting
        ? Number(limitSetting.value)
        : DEFAULT_3MF_LIMIT_MB;

      if (file.size > limitMb * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Ficheiro demasiado grande. O teu limite configurado é ${limitMb} MB.`,
          },
          { status: 400 },
        );
      }
    }

    const bucket = type === "3mf" ? "3mf" : "images";
    const key = `${session.user.id}/${Date.now()}-${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    return NextResponse.json({ key, bucket });
  } catch (error: any) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload", details: error.message },
      { status: 500 },
    );
  }
}
