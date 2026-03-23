// src/app/api/components/extract/route.ts
//
// Recebe um ficheiro .3mf via multipart/form-data,
// faz upload para Vercel Blob (ou R2),
// tenta extrair metadados (peso, tempo, materiais),
// e devolve os dados ao cliente.

import { getAuthUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob"; // npm install @vercel/blob
import { extractFrom3mf } from "@/lib/preflight/extractor";

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json(
        { error: "Ficheiro não fornecido" },
        { status: 400 },
      );

    const allowed = [".3mf", ".gcode", ".bgcode"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowed.includes(ext))
      return NextResponse.json(
        { error: "Formato não suportado. Usa .3mf, .gcode ou .bgcode" },
        { status: 400 },
      );

    // ── Upload para Vercel Blob ───────────────────────────────────────────────
    const blob = await put(
      `components/${userId}/${Date.now()}_${file.name}`,
      file,
      { access: "public" },
    );

    const filePath = blob.url;

    // ── Tentar extrair metadados (só para .3mf) ─────────────────────────────
    if (ext !== ".3mf") {
      return NextResponse.json({
        source: "manual_required",
        message: "Ficheiro carregado. Preenche manualmente o peso e o tempo.",
        filePath,
      });
    }

    try {
      const filaments = await extractFrom3mf(filePath);

      const totalG = filaments.reduce((acc, f) => acc + f.estimatedG, 0);

      return NextResponse.json({
        source: "3mf",
        filePath,
        filamentUsed: totalG > 0 ? Math.round(totalG) : null,
        printTime: null, // tempo não está disponível sem análise de G-code
        filaments,
      });
    } catch {
      return NextResponse.json({
        source: "manual_required",
        message: "Ficheiro carregado mas não foi possível extrair metadados.",
        filePath,
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
