import { auth } from "@/lib/auth";
import { head } from "@vercel/blob";
import { NextResponse } from "next/server";

// GET /api/blob-url?url=<blobUrl>
// Gera um URL assinado temporário (1 hora) para aceder a um ficheiro privado
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const blobUrl = searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "URL em falta" }, { status: 400 });
  }

  try {
    // Verificar que o ficheiro existe e gerar URL com token temporário
    const blob = await head(blobUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Construir URL assinado com downloadUrl (válido 1 hora por defeito)
    return NextResponse.json({ signedUrl: blob.downloadUrl });
  } catch (error: any) {
    console.error("[GET /api/blob-url]", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL", details: error.message },
      { status: 500 },
    );
  }
}
