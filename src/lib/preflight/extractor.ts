// src/lib/preflight/extractor.ts
//
// Extrai metadados de ficheiros .3mf (Bambu Studio, PrusaSlicer).
//
// ─── O que é detectável ────────────────────────────────────────────────────────
//
// SEMPRE (ficheiro não fatiado):
//   • Número de placas      → contar Metadata/plate_N.png
//   • Filamentos globais    → project_settings.config (filament_type + filament_colour)
//   • Objectos por placa    → Metadata/plate_N.json → bbox_objects[].name
//   • Extruder por objecto  → Metadata/model_settings.config → <object extruder="N">
//   • Filamentos por placa  → cruzar objectos → extruder → slot → material+cor
//
// APENAS APÓS FATIAMENTO (slice):
//   • Tempo de impressão    → slice_info.config → <plate><filament used_g= time=/>
//   • Gramas por filamento  → idem
//
// Se o ficheiro não foi fatiado, tempo e gramas ficam null.
// O modal mostra os campos em branco para o utilizador preencher.
//
// ─── Resultado ─────────────────────────────────────────────────────────────────
//
// {
//   source: "3mf_sliced" | "3mf_plates" | "3mf_no_weight" | "manual_required"
//   plates: [{
//     plateNumber: 1,
//     name: "stick2.stl + stick1.stl",
//     printTime: 82 | null,        // minutos, só se fatiado
//     filamentUsed: 14.3 | null,   // gramas totais, só se fatiado
//     filaments: [{ material, colorHex, colorName, estimatedG }]
//   }]
//   // retrocompatibilidade (perfil único):
//   printTime: number | null
//   filamentUsed: number | null
//   filaments: ExtractedMaterial[]
//   batchSize: 1
// }

import JSZip from "jszip";
import { parseStringPromise } from "xml2js";
import * as fs from "fs/promises";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedMaterial {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

export interface ExtractedPlate {
  plateNumber: number;
  name: string | null;
  printTime: number | null; // minutos
  filamentUsed: number | null; // gramas totais
  filaments: ExtractedMaterial[];
}

export interface ExtractionResult {
  // "3mf_sliced"    — fatiado, tem tempo + gramas
  // "3mf_plates"    — não fatiado, tem N placas com filamentos mas sem tempo/gramas
  // "3mf_no_weight" — detectou filamentos mas sem gramas (compatibilidade)
  // "manual_required" — não foi possível extrair nada útil
  source: "3mf_sliced" | "3mf_plates" | "3mf_no_weight" | "manual_required";
  plates: ExtractedPlate[];
  // Retrocompatibilidade: valores do perfil raiz (primeira placa ou soma)
  printTime: number | null;
  filamentUsed: number | null;
  filaments: ExtractedMaterial[];
  batchSize: number;
  message?: string;
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function extractFrom3mf(
  input: Buffer | string,
): Promise<ExtractionResult> {
  let buffer: Buffer;

  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (input.startsWith("http")) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Download falhou: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    buffer = await fs.readFile(input);
  }

  const zip = await JSZip.loadAsync(buffer);

  // 1. Tentar Bambu Studio (com ou sem slice)
  const bambu = await tryExtractBambu(zip);
  if (bambu) return bambu;

  // 2. Tentar PrusaSlicer
  const prusa = await tryExtractPrusa(zip);
  if (prusa) return prusa;

  return {
    source: "manual_required",
    plates: [],
    printTime: null,
    filamentUsed: null,
    filaments: [],
    batchSize: 1,
    message: "Não foi possível extrair metadados. Preenche manualmente.",
  };
}

// ─── Bambu Studio ─────────────────────────────────────────────────────────────

async function tryExtractBambu(zip: JSZip): Promise<ExtractionResult | null> {
  // ── Passo 1: Filamentos globais (project_settings.config) ──────────────────
  const projectFile = zip.file("Metadata/project_settings.config");
  if (!projectFile) return null;

  let globalSlots: Record<number, { material: string; colorHex: string }> = {};
  try {
    const config = JSON.parse(await projectFile.async("text"));
    const types: string[] = config.filament_type ?? [];
    const colours: string[] = config.filament_colour ?? [];
    types.forEach((type, i) => {
      globalSlots[i + 1] = {
        material: normalizeMaterial(type),
        colorHex: normalizeHex(colours[i] ?? "#888888"),
      };
    });
  } catch {
    return null;
  }

  if (Object.keys(globalSlots).length === 0) return null;

  // ── Passo 2: Número de placas (contar plate_N.png) ─────────────────────────
  const plateNums = detectPlateCount(zip);
  if (plateNums.length === 0) plateNums.push(1); // fallback

  // ── Passo 3: Extruder por objecto (model_settings.config) ─────────────────
  const objExtruder = await extractObjectExtruders(zip);

  // ── Passo 4: Objectos por placa (plate_N.json) ────────────────────────────
  const plateObjects = await extractPlateObjects(zip);

  // ── Passo 5: Slice info — tempo e gramas (só se fatiado) ──────────────────
  const sliceData = await extractSliceInfo(zip);

  // ── Passo 6: Construir plates ──────────────────────────────────────────────
  const plates: ExtractedPlate[] = plateNums.map((pnum) => {
    const objNames = plateObjects[pnum] ?? [];

    // Determinar filamentos desta placa cruzando objectos → extruder → slot
    let filaments: ExtractedMaterial[] = [];
    if (objNames.length > 0) {
      const usedSlots = new Set<number>();
      for (const name of objNames) {
        const ext = objExtruder[name];
        if (ext) usedSlots.add(ext);
      }
      filaments = Array.from(usedSlots)
        .sort()
        .filter((s) => globalSlots[s])
        .map((s) => ({
          material: globalSlots[s].material,
          colorHex: globalSlots[s].colorHex,
          colorName: null,
          estimatedG: 0, // não disponível antes de fatiar
        }));
    }

    // Dados de slice para esta placa (se existirem)
    const sd = sliceData[pnum];

    return {
      plateNumber: pnum,
      name: objNames.length > 0 ? objNames.join(" + ") : null,
      printTime: sd?.printTime ?? null,
      filamentUsed: sd?.filamentUsed ?? null,
      filaments: sd?.filaments.length ? sd.filaments : filaments,
    };
  });

  // ── Resultado ──────────────────────────────────────────────────────────────
  const hasSliceData = plates.some(
    (p) => p.printTime !== null || p.filamentUsed !== null,
  );
  const hasFilaments = plates.some((p) => p.filaments.length > 0);

  if (!hasSliceData && !hasFilaments) {
    // Nada útil para além dos slots globais — devolver filamentos globais sem gramas
    const globalFilaments = Object.values(globalSlots).map((s) => ({
      material: s.material,
      colorHex: s.colorHex,
      colorName: null,
      estimatedG: 0,
    }));
    return {
      source: "3mf_no_weight",
      plates: [],
      printTime: null,
      filamentUsed: null,
      filaments: globalFilaments,
      batchSize: 1,
      message: `${globalFilaments.length} filamento(s) detectado(s). Preenche tempo e gramas manualmente.`,
    };
  }

  const firstPlate = plates[0];
  const totalTime = plates.reduce((s, p) => s + (p.printTime ?? 0), 0);
  const totalG = plates.reduce((s, p) => s + (p.filamentUsed ?? 0), 0);

  return {
    source: hasSliceData ? "3mf_sliced" : "3mf_plates",
    plates,
    // Retrocompatibilidade — valores da primeira placa
    printTime: totalTime > 0 ? totalTime : null,
    filamentUsed: totalG > 0 ? totalG : null,
    filaments: firstPlate?.filaments ?? [],
    batchSize: 1,
    message: hasSliceData
      ? `${plates.length} mesa(s) com tempo e gramas extraídos.`
      : `${plates.length} mesa(s) detectada(s). Preenche tempo e gramas manualmente — o ficheiro não foi fatiado.`,
  };
}

// ─── Slice info (Bambu, ficheiro fatiado) ─────────────────────────────────────

async function extractSliceInfo(
  zip: JSZip,
): Promise<
  Record<
    number,
    {
      printTime: number | null;
      filamentUsed: number | null;
      filaments: ExtractedMaterial[];
    }
  >
> {
  const result: Record<
    number,
    {
      printTime: number | null;
      filamentUsed: number | null;
      filaments: ExtractedMaterial[];
    }
  > = {};

  const sliceFile = zip.file("Metadata/slice_info.config");
  if (!sliceFile) return result;

  try {
    const content = await sliceFile.async("text");
    const parsed: any = await parseStringPromise(content, {
      explicitArray: true,
    });
    const plates = parsed?.config?.plate ?? [];

    for (const plate of plates) {
      // O Bambu Studio escreve os dados como <metadata key="..." value="..."/>
      // dentro de cada <plate> — não como atributos directos do <plate>.
      const meta: Record<string, string> = {};
      for (const m of plate.metadata ?? []) {
        const k = m.$.key;
        const v = m.$.value;
        if (k && v !== undefined) meta[k] = v;
      }

      const id = parseInt(meta.index ?? "1", 10);
      const predSec = parseFloat(meta.prediction ?? "0");
      const printTime = predSec > 0 ? Math.round(predSec / 60) : null;
      // weight = gramas totais da placa (soma de todos os filamentos)
      const weightG = parseFloat(meta.weight ?? "0");

      // <filament id="..." type="PLA" color="#RRGGBB" used_g="12.3" .../>
      const filaments: ExtractedMaterial[] = (plate.filament ?? [])
        .map((f: any) => {
          const a = f.$ ?? {};
          return {
            material: normalizeMaterial(a.type ?? ""),
            colorHex: a.color ? normalizeHex(a.color) : null,
            colorName: null,
            estimatedG: parseFloat(a.used_g ?? "0"),
          };
        })
        .filter((f: ExtractedMaterial) => f.material && f.estimatedG > 0);

      const totalG = filaments.reduce(
        (s: number, f: ExtractedMaterial) => s + f.estimatedG,
        0,
      );

      result[id] = {
        printTime,
        filamentUsed: totalG > 0 ? totalG : weightG > 0 ? weightG : null,
        filaments,
      };
    }
  } catch {
    // slice_info vazio ou inválido — ficheiro não fatiado
  }

  return result;
}

// ─── Helpers: plate count, object→extruder, plate→objects ────────────────────

function detectPlateCount(zip: JSZip): number[] {
  const nums = new Set<number>();
  // plate_N.png (excluindo variantes: _small, no_light, top_, pick_)
  const plateRe = /^Metadata\/plate_(\d+)\.png$/;
  zip.forEach((path) => {
    const m = path.match(plateRe);
    if (m) nums.add(parseInt(m[1], 10));
  });
  return Array.from(nums).sort((a, b) => a - b);
}

async function extractObjectExtruders(
  zip: JSZip,
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const f = zip.file("Metadata/model_settings.config");
  if (!f) return result;

  try {
    const xml = await f.async("text");
    const parsed: any = await parseStringPromise(xml, { explicitArray: true });
    const objects = parsed?.config?.object ?? [];

    for (const obj of objects) {
      let name: string | null = null;
      let extruder: number | null = null;
      for (const meta of obj.metadata ?? []) {
        const k = meta.$.key;
        const v = meta.$.value;
        if (k === "name") name = v;
        if (k === "extruder") extruder = parseInt(v, 10);
      }
      if (name && extruder !== null) result[name] = extruder;
    }
  } catch {
    // best-effort
  }

  return result;
}

async function extractPlateObjects(
  zip: JSZip,
): Promise<Record<number, string[]>> {
  const result: Record<number, string[]> = {};
  const plateJsonRe = /^Metadata\/plate_(\d+)\.json$/;

  const promises: Promise<void>[] = [];
  zip.forEach((path, file) => {
    const m = path.match(plateJsonRe);
    if (!m) return;
    const pnum = parseInt(m[1], 10);
    promises.push(
      file.async("text").then((text) => {
        try {
          const data = JSON.parse(text);
          const names = (data.bbox_objects ?? []).map(
            (o: any) => o.name as string,
          );
          if (names.length > 0) result[pnum] = names;
        } catch {
          // malformed json
        }
      }),
    );
  });
  await Promise.all(promises);
  return result;
}

// ─── PrusaSlicer ─────────────────────────────────────────────────────────────

async function tryExtractPrusa(zip: JSZip): Promise<ExtractionResult | null> {
  const configFile =
    zip.file("Metadata/Slic3r_PE.config") ??
    zip.file("Metadata/PrusaSlicer.config");
  if (!configFile) return null;

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
    const printTimeSec = parseInt(
      getValue("estimated_print_time")[0] ?? "0",
      10,
    );

    if (types.length === 0) return null;

    const filaments: ExtractedMaterial[] = types
      .map((type, i) => ({
        material: type,
        colorHex: colors[i] ? normalizeHex(colors[i]) : null,
        colorName: null,
        estimatedG: usedG[i] ?? 0,
      }))
      .filter((m) => m.estimatedG > 0 || types.length === 1);

    const totalG = filaments.reduce((s, f) => s + f.estimatedG, 0);
    const printTime = printTimeSec > 0 ? Math.round(printTimeSec / 60) : null;
    const hasData = totalG > 0 || printTime !== null;

    return {
      source: hasData ? "3mf_sliced" : "3mf_no_weight",
      plates: [
        {
          plateNumber: 1,
          name: null,
          printTime,
          filamentUsed: totalG > 0 ? totalG : null,
          filaments,
        },
      ],
      printTime,
      filamentUsed: totalG > 0 ? totalG : null,
      filaments,
      batchSize: 1,
    };
  } catch {
    return null;
  }
}

// ─── Normalização ─────────────────────────────────────────────────────────────

function normalizeMaterial(type: string): string {
  const map: Record<string, string> = {
    "PLA Basic": "PLA",
    "PLA Matte": "PLA",
    "PLA-CF": "PLA-CF",
    "PETG HF": "PETG",
    "PETG-CF": "PETG-CF",
    "TPU 95A": "TPU",
    "PA6-CF": "PA6-CF",
  };
  return map[type] ?? type;
}

function normalizeHex(color: string): string {
  const c = color.replace("#", "").toUpperCase();
  if (c.length >= 8) return `#${c.slice(0, 6)}`; // remover alpha (RRGGBBAA → RRGGBB)
  if (c.length === 6) return `#${c}`;
  return `#${c.padEnd(6, "0")}`;
}
