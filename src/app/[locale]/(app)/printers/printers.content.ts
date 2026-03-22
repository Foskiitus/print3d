import { t, type DeclarationContent } from "intlayer";

const printersContent = {
  key: "printers",
  content: {
    // ── Page (page.tsx) ──────────────────────────────────────────
    page: {
      title: t({ en: "Printers", pt: "Impressoras" }),
      heading: t({ en: "Printers", pt: "Impressoras" }),
      description: t({
        en: "Manage your machine fleet for precise energy cost calculations.",
        pt: "Gere o parque de máquinas para cálculos de custo energético precisos.",
      }),
      costsInfo: {
        heading: t({
          en: "How do costs work?",
          pt: "Como funcionam os custos?",
        }),
        // Split into parts so <strong> can be rendered without dangerouslySetInnerHTML
        bodyPart1: t({
          en: "The",
          pt: "O",
        }),
        hourlyCost: t({
          en: "Hourly Cost",
          pt: "Custo Horário",
        }),
        bodyPart2: t({
          en: "should include machine depreciation and preventive maintenance. The",
          pt: "deve incluir a amortização da máquina e manutenção preventiva. O",
        }),
        consumption: t({
          en: "Consumption (W)",
          pt: "Consumo (W)",
        }),
        bodyPart3: t({
          en: "is used to calculate electricity usage based on print time.",
          pt: "é usado para calcular o gasto elétrico com base no tempo de impressão.",
        }),
      },
    },

    // ── Global presets (admin) ───────────────────────────────────
    presets: {
      heading: t({ en: "Global Presets", pt: "Presets Globais" }),
      adminBadge: t({ en: "Admin", pt: "Admin" }),
      globalPreset: t({ en: "Global preset", pt: "Preset global" }),
      empty: t({
        en: "No presets created yet. Add global printers for users to choose from.",
        pt: "Nenhum preset criado ainda. Adiciona impressoras globais para os utilizadores escolherem.",
      }),
    },

    // ── My machines ──────────────────────────────────────────────
    myMachines: {
      heading: t({ en: "My Machines", pt: "Minhas Máquinas" }),
      empty: t({
        en: "No printers registered. Add your first machine.",
        pt: "Nenhuma impressora registada. Adiciona a tua primeira máquina.",
      }),
    },

    // ── Toast messages ───────────────────────────────────────────
    toast: {
      printerDeleted: t({ en: "Printer deleted", pt: "Impressora eliminada" }),
      presetDeleted: t({ en: "Preset deleted", pt: "Preset eliminado" }),
      error: t({ en: "Error", pt: "Erro" }),
      confirmDeletePrinter: t({
        en: "Delete this printer? This action cannot be undone.",
        pt: "Eliminar esta impressora? Esta ação não pode ser desfeita.",
      }),
      confirmDeletePreset: t({
        en: "Delete this preset? Existing printers will not be affected.",
        pt: "Eliminar este preset? As impressoras existentes não serão afetadas.",
      }),
    },
  },
} satisfies DeclarationContent;

export default printersContent;
