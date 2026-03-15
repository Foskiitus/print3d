import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

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

    if (type === "image" && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Ficheiro deve ser uma imagem" },
        { status: 400 },
      );
    }

    if (type === "3mf" && !file.name.endsWith(".3mf")) {
      return NextResponse.json(
        { error: "Ficheiro deve ser .3mf" },
        { status: 400 },
      );
    }

    const folder = type === "3mf" ? "3mf" : "images";
    const filename = `${folder}/${session.user.id}/${Date.now()}-${file.name}`;

    const blob = await put(filename, file, {
      access: "private", // ✅ store privada
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload", details: error.message },
      { status: 500 },
    );
  }
}
