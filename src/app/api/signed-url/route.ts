import { getAuthUserId } from "@/lib/auth";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// GET /api/signed-url?key=<r2key>&bucket=<bucket>
// Gera uma URL assinada fresca válida por 6 dias (abaixo do limite de 7 dias do R2)
export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const bucket = searchParams.get("bucket") ?? "images";

  if (!key) {
    return NextResponse.json({ error: "Key em falta" }, { status: 400 });
  }

  // Segurança: verificar que a key pertence ao utilizador autenticado
  if (!key.startsWith(userId + "/")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 60 * 60 * 24 * 6 }, // 6 dias
    );

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[GET /api/signed-url]", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL", details: error.message },
      { status: 500 },
    );
  }
}
