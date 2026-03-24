// src/lib/preflight/extractor.ts
//
// Extrai os materiais necessários de um ficheiro .3mf.
//
// Um ficheiro .3mf é um ZIP que contém:
//   - 3D/3dmodel.model (XML com geometria e metadados)
//   - Metadata/Slic3r_PE.config (Bambu/PrusaSlicer — configurações de filamento)
//   - [Content_Types].xml
//
// Bambu Studio escreve os filamentos em:
//   <plate_list> → <plate> → <filament_ids> e <filament>
// PrusaSlicer escreve em:
//   Metadata/Slic3r_PE.config como filament_type, filament_colour, filament_used_g

import JSZip from "jszip"; // npm install jszip
import { parseString } from "xml2js"; // npm install xml2js
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const parseXml = promisify(parseString);

export interface ExtractedMaterial {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

export async function extractFrom3mf(
  input: Buffer | string,
): Promise<ExtractedMaterial[]> {
  // Aceita Buffer directo (vindo do R2) ou path/URL (compatibilidade)
  let buffer: Buffer;

  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (input.startsWith("http")) {
    const res = await fetch(input);
    if (!res.ok)
      throw new Error(`Não foi possível descarregar o ficheiro: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    buffer = await fs.readFile(input);
  }

  const zip = await JSZip.loadAsync(buffer);

  // ── Tentar Bambu Studio first ─────────────────────────────────────────────
  const bambuResult = await tryExtractBambu(zip);
  if (bambuResult.length > 0) return bambuResult;

  // ── Tentar PrusaSlicer / Slic3r ──────────────────────────────────────────
  const prusaResult = await tryExtractPrusa(zip);
  if (prusaResult.length > 0) return prusaResult;

  // ── Fallback: tentar modelo 3D base ──────────────────────────────────────
  const modelResult = await tryExtractModel(zip);
  if (modelResult.length > 0) return modelResult;

  throw new Error("Não foi possível extrair materiais deste ficheiro .3mf.");
}

// ─── Bambu Studio (.3mf com metadados Bambu) ─────────────────────────────────

async function tryExtractBambu(zip: JSZip): Promise<ExtractedMaterial[]> {
  // Prioridade 1: slice_info.config (ficheiro já fatiado — tem filament_used_g)
  // Prioridade 2: project_settings.config (ficheiro de projecto — tem cores mas não tem gramas)

  // Tentar primeiro slice_info.config como XML
  const sliceFile = zip.file("Metadata/slice_info.config");
  if (sliceFile) {
    try {
      const content = await sliceFile.async("text");
      // slice_info é XML no Bambu Studio moderno
      const parsed: any = await parseXml(content);
      const plates = parsed?.config?.plate ?? [];
      const results: ExtractedMaterial[] = [];
      for (const plate of plates) {
        const filaments = plate.filament ?? [];
        for (const fil of filaments) {
          const attr = fil.$ ?? {};
          if (attr.id && attr.type) {
            results.push({
              material: normalizeBambuMaterial(attr.type),
              colorHex: attr.color ? normalizeHex(attr.color) : null,
              colorName: null,
              estimatedG: parseFloat(attr.used_g ?? "0"),
            });
          }
        }
      }
      if (results.length > 0) return results;
    } catch {
      // slice_info não é XML ou está vazio — continuar
    }
  }

  // Tentar project_settings.config (JSON) — tem cores mas normalmente não tem gramas
  const projectFile = zip.file("Metadata/project_settings.config");
  if (!projectFile) return [];

  try {
    const content = await projectFile.async("text");
    const config = JSON.parse(content);

    const types: string[] = config.filament_type ?? [];
    const colors: string[] = config.filament_colour ?? [];
    // filament_used_g só existe em ficheiros fatiados
    const usedG: number[] = (config.filament_used_g ?? []).map(Number);

    if (types.length === 0) return [];

    const results = types.map((type, i) => ({
      material: normalizeBambuMaterial(type),
      colorHex: colors[i] ? normalizeHex(colors[i]) : null,
      colorName: null,
      estimatedG: usedG[i] ?? 0,
    }));

    // Se tem gramas (ficheiro fatiado), filtrar os que têm gramas > 0
    const hasGrams = results.some((r) => r.estimatedG > 0);
    if (hasGrams) return results.filter((r) => r.estimatedG > 0);

    // Ficheiro não fatiado — devolver as cores/materiais sem gramas
    // O utilizador vai preencher as gramas manualmente, mas pelo menos
    // já temos as cores e materiais correctos
    return results;
  } catch {
    return [];
  }
}

// ─── PrusaSlicer / Slic3r ─────────────────────────────────────────────────────

async function tryExtractPrusa(zip: JSZip): Promise<ExtractedMaterial[]> {
  const configFile =
    zip.file("Metadata/Slic3r_PE.config") ??
    zip.file("Metadata/PrusaSlicer.config");

  if (!configFile) return [];

  try {
    const content = await configFile.async("text");
    const lines = content.split("\n");

    const getValue = (key: string): string[] => {
      const line = lines.find((l) => l.startsWith(`${key} =`));
      if (!line) return [];
      return line
        .split("=")[1]
        .trim()
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean);
    };

    const types = getValue("filament_type");
    const colors = getValue("filament_colour");
    const usedG = getValue("filament_used_g").map(Number);

    if (types.length === 0) return [];

    return types
      .map((type, i) => ({
        material: type,
        colorHex: colors[i] ? normalizeHex(colors[i]) : null,
        colorName: null,
        estimatedG: usedG[i] ?? 0,
      }))
      .filter((m) => m.estimatedG > 0 || types.length === 1);
  } catch {
    return [];
  }
}

// ─── Fallback: modelo 3D base ─────────────────────────────────────────────────

async function tryExtractModel(zip: JSZip): Promise<ExtractedMaterial[]> {
  const modelFile = zip.file("3D/3dmodel.model");
  if (!modelFile) return [];

  try {
    const content = await modelFile.async("text");
    const parsed: any = await parseXml(content);

    // Procurar elementos <m:material> no namespace 3MF
    const resources = parsed?.model?.resources?.[0];
    if (!resources) return [];

    const materials: ExtractedMaterial[] = [];

    // basematerials
    const baseGroups = resources.basematerials ?? [];
    for (const group of baseGroups) {
      const bases = group.base ?? [];
      for (const base of bases) {
        const name = base.$?.name ?? "Unknown";
        const color = base.$?.displaycolor ?? null;
        materials.push({
          material: inferMaterialFromName(name),
          colorHex: color ? normalizeHex(color) : null,
          colorName: name,
          estimatedG: 0, // modelo base não tem peso estimado
        });
      }
    }

    return materials;
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeBambuMaterial(type: string): string {
  // Bambu usa nomes como "PLA Basic", "PETG HF", "PA6-CF" — normalizar para tipo base
  const map: Record<string, string> = {
    "PLA Basic": "PLA",
    "PLA Matte": "PLA",
    "PLA-CF": "PLA-CF",
    "PETG HF": "PETG",
    "PETG-CF": "PETG-CF",
    ABS: "ABS",
    ASA: "ASA",
    "TPU 95A": "TPU",
    "PA6-CF": "PA6-CF",
  };
  return map[type] ?? type;
}

function inferMaterialFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("pla")) return "PLA";
  if (lower.includes("petg")) return "PETG";
  if (lower.includes("abs")) return "ABS";
  if (lower.includes("asa")) return "ASA";
  if (lower.includes("tpu") || lower.includes("flex")) return "TPU";
  if (lower.includes("pa") || lower.includes("nylon")) return "PA";
  if (lower.includes("pva")) return "PVA";
  return name;
}

function normalizeHex(color: string): string {
  // Garante formato #RRGGBB
  const c = color.replace("#", "").toUpperCase();
  if (c.length === 6) return `#${c}`;
  if (c.length === 8) return `#${c.slice(0, 6)}`; // remover alpha
  return `#${c}`;
}
