import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Filamentos ───────────────────────────────────────────────────────────────

const colors: Record<string, { name: string; hex: string }[]> = {
  default: [
    { name: "Black", hex: "#1a1a1a" },
    { name: "White", hex: "#f5f5f5" },
    { name: "Grey", hex: "#9e9e9e" },
    { name: "Red", hex: "#e53935" },
    { name: "Blue", hex: "#1e88e5" },
    { name: "Green", hex: "#43a047" },
    { name: "Yellow", hex: "#fdd835" },
    { name: "Orange", hex: "#fb8c00" },
    { name: "Purple", hex: "#8e24aa" },
    { name: "Pink", hex: "#e91e63" },
    { name: "Brown", hex: "#6d4c41" },
    { name: "Transparent", hex: "#e0f7fa" },
  ],
};

function getColors(brand: string) {
  return colors[brand] ?? colors.default;
}

const catalog: {
  brand: string;
  material: string;
  spoolWeight: number;
  density?: number;
}[] = [
  // ── Bambu Lab ──────────────────────────────────────────────────────────────
  {
    brand: "Bambu Lab",
    material: "PLA Basic",
    spoolWeight: 1000,
    density: 1.24,
  },
  {
    brand: "Bambu Lab",
    material: "PLA Matte",
    spoolWeight: 1000,
    density: 1.24,
  },
  { brand: "Bambu Lab", material: "PETG HF", spoolWeight: 1000, density: 1.27 },
  { brand: "Bambu Lab", material: "ABS", spoolWeight: 1000, density: 1.04 },
  { brand: "Bambu Lab", material: "ASA", spoolWeight: 1000, density: 1.07 },
  { brand: "Bambu Lab", material: "TPU 95A", spoolWeight: 1000, density: 1.21 },
  { brand: "Bambu Lab", material: "PA6-CF", spoolWeight: 500, density: 1.1 },
  { brand: "Bambu Lab", material: "PLA-CF", spoolWeight: 500, density: 1.3 },
  { brand: "Bambu Lab", material: "PETG-CF", spoolWeight: 500, density: 1.3 },

  // ── Polymaker ─────────────────────────────────────────────────────────────
  {
    brand: "Polymaker",
    material: "PolyLite PLA",
    spoolWeight: 1000,
    density: 1.24,
  },
  {
    brand: "Polymaker",
    material: "PolyMax PLA",
    spoolWeight: 750,
    density: 1.24,
  },
  {
    brand: "Polymaker",
    material: "PolyLite PETG",
    spoolWeight: 1000,
    density: 1.27,
  },
  {
    brand: "Polymaker",
    material: "PolyLite ABS",
    spoolWeight: 1000,
    density: 1.04,
  },
  {
    brand: "Polymaker",
    material: "PolyLite ASA",
    spoolWeight: 1000,
    density: 1.07,
  },
  {
    brand: "Polymaker",
    material: "PolyFlex TPU95",
    spoolWeight: 750,
    density: 1.21,
  },
  { brand: "Polymaker", material: "PA6-GF", spoolWeight: 500, density: 1.18 },

  // ── Prusament ─────────────────────────────────────────────────────────────
  { brand: "Prusament", material: "PLA", spoolWeight: 1000, density: 1.24 },
  { brand: "Prusament", material: "PETG", spoolWeight: 1000, density: 1.27 },
  { brand: "Prusament", material: "ASA", spoolWeight: 850, density: 1.07 },
  {
    brand: "Prusament",
    material: "PLA Blend",
    spoolWeight: 1000,
    density: 1.24,
  },
  {
    brand: "Prusament",
    material: "PETG Carbon Fiber",
    spoolWeight: 500,
    density: 1.3,
  },

  // ── eSUN ──────────────────────────────────────────────────────────────────
  { brand: "eSUN", material: "PLA+", spoolWeight: 1000, density: 1.24 },
  { brand: "eSUN", material: "PETG", spoolWeight: 1000, density: 1.27 },
  { brand: "eSUN", material: "ABS+", spoolWeight: 1000, density: 1.04 },
  { brand: "eSUN", material: "eTPU-95A", spoolWeight: 1000, density: 1.21 },
  { brand: "eSUN", material: "eASA", spoolWeight: 1000, density: 1.07 },
  { brand: "eSUN", material: "PLA-CF", spoolWeight: 500, density: 1.3 },

  // ── Fillamentum ───────────────────────────────────────────────────────────
  {
    brand: "Fillamentum",
    material: "PLA Extrafill",
    spoolWeight: 750,
    density: 1.24,
  },
  {
    brand: "Fillamentum",
    material: "PETG Extrafill",
    spoolWeight: 750,
    density: 1.27,
  },
  {
    brand: "Fillamentum",
    material: "ASA Extrafill",
    spoolWeight: 750,
    density: 1.07,
  },
  {
    brand: "Fillamentum",
    material: "ABS Extrafill",
    spoolWeight: 750,
    density: 1.04,
  },
  {
    brand: "Fillamentum",
    material: "Flexfill TPU 98A",
    spoolWeight: 500,
    density: 1.22,
  },

  // ── Fiberlogy ─────────────────────────────────────────────────────────────
  { brand: "Fiberlogy", material: "Easy PLA", spoolWeight: 850, density: 1.24 },
  { brand: "Fiberlogy", material: "PETG", spoolWeight: 850, density: 1.27 },
  {
    brand: "Fiberlogy",
    material: "NYLON PA12",
    spoolWeight: 500,
    density: 1.01,
  },
  {
    brand: "Fiberlogy",
    material: "FiberSmooth",
    spoolWeight: 850,
    density: 1.24,
  },
  {
    brand: "Fiberlogy",
    material: "FIBERFLEX 40D",
    spoolWeight: 500,
    density: 1.2,
  },
];

// ─── Presets de Impressoras ───────────────────────────────────────────────────

const PRINTER_PRESETS: {
  name: string;
  brand: string;
  model: string;
  extrusionType: string;
  multiMaterialSlots: number;
  powerWatts: number;
  hourlyCost: number;
  maintenanceTasks: { taskName: string; intervalHours: number }[];
}[] = [
  // ── Creality ──────────────────────────────────────────────────────────────
  {
    name: "Creality Ender 3",
    brand: "Creality",
    model: "Ender 3",
    extrusionType: "Bowden",
    multiMaterialSlots: 1,
    powerWatts: 270,
    hourlyCost: 0.05,
    maintenanceTasks: [
      { taskName: "Lubrificar eixos X/Y/Z", intervalHours: 200 },
      { taskName: "Verificar tensão das correias", intervalHours: 100 },
      { taskName: "Limpar tubo PTFE (Bowden)", intervalHours: 150 },
      { taskName: "Nivelar cama manualmente", intervalHours: 50 },
    ],
  },
  {
    name: "Creality CR-10",
    brand: "Creality",
    model: "CR-10",
    extrusionType: "Bowden",
    multiMaterialSlots: 1,
    powerWatts: 350,
    hourlyCost: 0.06,
    maintenanceTasks: [
      { taskName: "Lubrificar eixos X/Y/Z", intervalHours: 200 },
      { taskName: "Verificar tensão das correias", intervalHours: 100 },
      { taskName: "Limpar tubo PTFE (Bowden)", intervalHours: 200 },
      { taskName: "Inspecionar cama de vidro", intervalHours: 100 },
    ],
  },
  {
    name: "Creality K1",
    brand: "Creality",
    model: "K1",
    extrusionType: "Direct",
    multiMaterialSlots: 1,
    powerWatts: 1000,
    hourlyCost: 0.12,
    maintenanceTasks: [
      { taskName: "Lubrificar guias lineares", intervalHours: 300 },
      { taskName: "Limpar extrusora direta", intervalHours: 200 },
      { taskName: "Verificar ventoinhas de arrefecimento", intervalHours: 500 },
      { taskName: "Calibrar input shaping", intervalHours: 500 },
    ],
  },

  // ── Bambu Lab ─────────────────────────────────────────────────────────────
  {
    name: "Bambu Lab P1S",
    brand: "Bambu Lab",
    model: "P1S",
    extrusionType: "Direct",
    multiMaterialSlots: 20, // suporta até 5 AMS × 4 slots
    powerWatts: 1000,
    hourlyCost: 0.15,
    maintenanceTasks: [
      { taskName: "Lubrificar eixos e guias", intervalHours: 300 },
      { taskName: "Limpar AMS (sensores e roletes)", intervalHours: 200 },
      { taskName: "Verificar filtro de carbono ativo", intervalHours: 500 },
      { taskName: "Limpar sensor de cama", intervalHours: 200 },
      { taskName: "Atualizar firmware", intervalHours: 500 },
    ],
  },
  {
    name: "Bambu Lab X1C",
    brand: "Bambu Lab",
    model: "X1C",
    extrusionType: "Direct",
    multiMaterialSlots: 20,
    powerWatts: 1400,
    hourlyCost: 0.18,
    maintenanceTasks: [
      { taskName: "Lubrificar guias lineares de carbono", intervalHours: 300 },
      { taskName: "Limpar AMS (sensores e roletes)", intervalHours: 200 },
      { taskName: "Verificar filtro de carbono ativo", intervalHours: 500 },
      { taskName: "Limpar lente do LiDAR", intervalHours: 100 },
      { taskName: "Inspecionar nozzle de aço endurecido", intervalHours: 400 },
      { taskName: "Atualizar firmware", intervalHours: 500 },
    ],
  },
  {
    name: "Bambu Lab A1",
    brand: "Bambu Lab",
    model: "A1",
    extrusionType: "Direct",
    multiMaterialSlots: 20,
    powerWatts: 1000,
    hourlyCost: 0.12,
    maintenanceTasks: [
      { taskName: "Lubrificar eixos", intervalHours: 300 },
      { taskName: "Limpar AMS Lite", intervalHours: 200 },
      { taskName: "Verificar tensão das correias", intervalHours: 200 },
      { taskName: "Atualizar firmware", intervalHours: 500 },
    ],
  },

  // ── Prusa ─────────────────────────────────────────────────────────────────
  {
    name: "Prusa MK4",
    brand: "Prusa",
    model: "MK4",
    extrusionType: "Direct",
    multiMaterialSlots: 5, // com MMU3
    powerWatts: 240,
    hourlyCost: 0.08,
    maintenanceTasks: [
      { taskName: "Lubrificar varões lisos e fuso Z", intervalHours: 200 },
      { taskName: "Verificar tensão correia X/Y", intervalHours: 150 },
      { taskName: "Limpar extrusora Nextruder", intervalHours: 300 },
      { taskName: "Inspecionar PEI sheet", intervalHours: 100 },
      { taskName: "Verificar loadcell (sensor de cama)", intervalHours: 300 },
    ],
  },
  {
    name: "Prusa Mini+",
    brand: "Prusa",
    model: "Mini+",
    extrusionType: "Bowden",
    multiMaterialSlots: 1,
    powerWatts: 180,
    hourlyCost: 0.05,
    maintenanceTasks: [
      { taskName: "Lubrificar varões e fuso Z", intervalHours: 200 },
      { taskName: "Verificar tensão das correias", intervalHours: 150 },
      { taskName: "Limpar tubo PTFE (Bowden)", intervalHours: 200 },
      { taskName: "Inspecionar PEI sheet", intervalHours: 100 },
    ],
  },

  // ── Voron ─────────────────────────────────────────────────────────────────
  {
    name: "Voron 2.4",
    brand: "Voron",
    model: "2.4",
    extrusionType: "Direct",
    multiMaterialSlots: 12, // com ERCF
    powerWatts: 800,
    hourlyCost: 0.1,
    maintenanceTasks: [
      { taskName: "Lubrificar guias lineares (MGN)", intervalHours: 200 },
      { taskName: "Verificar tensão correias X/Y/AB", intervalHours: 100 },
      { taskName: "Inspecionar parafusos Z (quad gantry)", intervalHours: 150 },
      { taskName: "Limpar extrusora (Stealthburner)", intervalHours: 300 },
      { taskName: "Verificar cabos e ligações (CAN bus)", intervalHours: 300 },
      { taskName: "Calibrar QGL (Quad Gantry Leveling)", intervalHours: 200 },
    ],
  },
  {
    name: "Voron Trident",
    brand: "Voron",
    model: "Trident",
    extrusionType: "Direct",
    multiMaterialSlots: 12,
    powerWatts: 700,
    hourlyCost: 0.09,
    maintenanceTasks: [
      { taskName: "Lubrificar guias lineares (MGN)", intervalHours: 200 },
      { taskName: "Verificar tensão correias X/Y", intervalHours: 100 },
      { taskName: "Inspecionar parafusos Z (3 pontos)", intervalHours: 150 },
      { taskName: "Limpar extrusora (Stealthburner)", intervalHours: 300 },
      { taskName: "Calibrar Z-tilt", intervalHours: 200 },
    ],
  },
  {
    name: "Voron 0.2",
    brand: "Voron",
    model: "0.2",
    extrusionType: "Direct",
    multiMaterialSlots: 1,
    powerWatts: 250,
    hourlyCost: 0.06,
    maintenanceTasks: [
      { taskName: "Lubrificar guias lineares", intervalHours: 200 },
      { taskName: "Verificar tensão correias", intervalHours: 100 },
      { taskName: "Limpar extrusora (Mini Stealthburner)", intervalHours: 300 },
    ],
  },

  // ── AnkerMake ─────────────────────────────────────────────────────────────
  {
    name: "AnkerMake M5",
    brand: "AnkerMake",
    model: "M5",
    extrusionType: "Direct",
    multiMaterialSlots: 1,
    powerWatts: 350,
    hourlyCost: 0.08,
    maintenanceTasks: [
      { taskName: "Lubrificar eixos e guias", intervalHours: 200 },
      { taskName: "Verificar tensão das correias", intervalHours: 150 },
      { taskName: "Limpar extrusora", intervalHours: 200 },
      { taskName: "Verificar câmara de monitorização", intervalHours: 300 },
    ],
  },
  {
    name: "AnkerMake M5C",
    brand: "AnkerMake",
    model: "M5C",
    extrusionType: "Direct",
    multiMaterialSlots: 1,
    powerWatts: 300,
    hourlyCost: 0.07,
    maintenanceTasks: [
      { taskName: "Lubrificar eixos e guias", intervalHours: 200 },
      { taskName: "Verificar tensão das correias", intervalHours: 150 },
      { taskName: "Limpar extrusora direta", intervalHours: 200 },
    ],
  },
];

// ─── Presets de Unidades de Expansão ─────────────────────────────────────────

const UNIT_PRESETS: {
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  notes?: string;
}[] = [
  // ── Bambu Lab ─────────────────────────────────────────────────────────────
  {
    name: "AMS 2 Pro",
    brand: "Bambu Lab",
    slotCount: 4,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes:
      "Suporta PLA, PETG, ABS, ASA, TPU. Não recomendado para PA-CF ou materiais abrasivos.",
  },
  {
    name: "AMS HT",
    brand: "Bambu Lab",
    slotCount: 1,
    supportsHighTemp: true,
    supportsAbrasive: true,
    notes:
      "Projetado para materiais de engenharia: PA-CF, PET-CF, PEI. Alta temperatura e abrasivos.",
  },
  {
    name: "AMS Lite",
    brand: "Bambu Lab",
    slotCount: 4,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes:
      "Versão simplificada do AMS. Suporta PLA e materiais básicos. Exclusivo para A1 e A1 Mini.",
  },

  // ── Prusa ─────────────────────────────────────────────────────────────────
  {
    name: "MMU3",
    brand: "Prusa",
    slotCount: 5,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes:
      "Multi Material Upgrade 3. Compatível com MK4 e MK3.9. 5 filamentos simultâneos.",
  },

  // ── Voron / Comunidade ────────────────────────────────────────────────────
  {
    name: "ERCF v2 (8T)",
    brand: "Voron / Comunidade",
    slotCount: 8,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes:
      "Enraged Rabbit Carrot Feeder v2, configuração de 8 canais. Open source.",
  },
  {
    name: "ERCF v2 (12T)",
    brand: "Voron / Comunidade",
    slotCount: 12,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes:
      "Enraged Rabbit Carrot Feeder v2, configuração de 12 canais. Open source.",
  },
  {
    name: "Tradrack (8T)",
    brand: "Voron / Comunidade",
    slotCount: 8,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes: "Alternativa ao ERCF. Mais simples de montar, 8 canais.",
  },

  // ── Mosaic ────────────────────────────────────────────────────────────────
  {
    name: "Palette 3",
    brand: "Mosaic Manufacturing",
    slotCount: 4,
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes:
      "Compatível com qualquer impressora FDM. Combina 4 filamentos numa única extrusão.",
  },
  {
    name: "Palette 3 Pro",
    brand: "Mosaic Manufacturing",
    slotCount: 8,
    supportsHighTemp: true,
    supportsAbrasive: false,
    notes: "Versão Pro com 8 canais e suporte a materiais de alta temperatura.",
  },
];

// ─── Setup Prisma ─────────────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. GlobalFilament ──────────────────────────────────────────────────────
  console.log("🌱 A fazer seed do catálogo de filamentos...");

  await prisma.globalFilament.deleteMany();

  const entries: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
    spoolWeight: number;
    density?: number;
  }[] = [];

  for (const item of catalog) {
    const colorList = getColors(item.brand);
    for (const color of colorList) {
      entries.push({
        brand: item.brand,
        material: item.material,
        colorName: color.name,
        colorHex: color.hex,
        spoolWeight: item.spoolWeight,
        density: item.density,
      });
    }
  }

  await prisma.globalFilament.createMany({ data: entries });
  console.log(
    `✅ ${entries.length} filamentos criados (${catalog.length} variantes de material)\n`,
  );

  // ── 2. PrinterPresets ──────────────────────────────────────────────────────
  console.log("🖨️  A fazer seed dos presets de impressoras...");

  await prisma.printerPreset.deleteMany({ where: { isGlobal: true } });

  for (const preset of PRINTER_PRESETS) {
    const { maintenanceTasks, ...presetData } = preset;

    const created = await prisma.printerPreset.create({
      data: {
        ...presetData,
        isGlobal: true,
        userId: null,
        maintenanceTasks: {
          create: maintenanceTasks,
        },
      },
    });

    console.log(
      `  ✅ ${created.brand} ${created.model} — ${maintenanceTasks.length} tarefas de manutenção`,
    );
  }

  console.log(
    `\n✅ ${PRINTER_PRESETS.length} presets de impressoras criados.\n`,
  );

  // ── 3. UnitPresets ────────────────────────────────────────────────────────
  console.log("🔧 A fazer seed do catálogo de unidades de expansão...");

  await prisma.unitPreset.deleteMany({ where: { isGlobal: true } });

  await prisma.unitPreset.createMany({
    data: UNIT_PRESETS.map((u) => ({ ...u, isGlobal: true })),
  });

  for (const u of UNIT_PRESETS) {
    console.log(
      `  ✅ ${u.brand} ${u.name} — ${u.slotCount} slots${u.supportsHighTemp ? " · alta temp" : ""}${u.supportsAbrasive ? " · abrasivos" : ""}`,
    );
  }

  console.log(
    `\n✨ Seed concluído: ${UNIT_PRESETS.length} unidades de expansão criadas.`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro no Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
