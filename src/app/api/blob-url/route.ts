import { auth } from "@/lib/auth";
import { head } from "@vercel/blob";
import { NextResponse } from "next/server";

// GET /api/blob-url?url=<blobUrl>
// Faz proxy da imagem privada através do servidor — o browser nunca acede diretamente ao Blob
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Não autenticado", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const blobUrl = searchParams.get("url");

  if (!blobUrl) {
    return new NextResponse("URL em falta", { status: 400 });
  }

  try {
    // Verificar que o ficheiro existe
    const blob = await head(blobUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Fazer fetch do conteúdo usando o token de servidor
    const response = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return new NextResponse("Ficheiro não encontrado", { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";

    // Devolver o conteúdo com headers corretos para o browser mostrar a imagem
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600", // cache 1 hora no browser
      },
    });
  } catch (error: any) {
    console.error("[GET /api/blob-url]", error);
    return new NextResponse("Erro ao carregar ficheiro", { status: 500 });
  }
}
