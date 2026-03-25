import { t, type DeclarationContent } from "intlayer";

const printersContent = {
  key: "printers",
  content: {
    // ── Página principal ─────────────────────────────────────────────────
    page: {
      title: t({ pt: "A Minha Oficina", en: "My Workshop" }),
      heading: t({ pt: "A Minha Oficina", en: "My Workshop" }),
      description: t({
        pt: "Gestão das tuas máquinas e sistemas de alimentação de filamento.",
        en: "Manage your machines and filament feeding systems.",
      }),
    },

    // ── Botões / ações ───────────────────────────────────────────────────
    actions: {
      addPrinter: t({ pt: "Adicionar Impressora", en: "Add Printer" }),
      addAccessory: t({
        pt: "Adicionar AMS / Acessório",
        en: "Add AMS / Accessory",
      }),
      edit: t({ pt: "Editar", en: "Edit" }),
      delete: t({ pt: "Eliminar Impressora", en: "Delete Printer" }),
      cancel: t({ pt: "Cancelar", en: "Cancel" }),
      save: t({ pt: "Guardar", en: "Save" }),
      next: t({ pt: "Seguinte →", en: "Next →" }),
      back: t({ pt: "← Voltar", en: "← Back" }),
      create: t({ pt: "Criar Impressora", en: "Create Printer" }),
      creating: t({ pt: "A criar...", en: "Creating..." }),
      adding: t({ pt: "A adicionar...", en: "Adding..." }),
      add: t({ pt: "Adicionar", en: "Add" }),
    },

    // ── Stats ────────────────────────────────────────────────────────────
    stats: {
      printers: t({ pt: "Impressoras", en: "Printers" }),
      online: t({ pt: "Online", en: "Online" }),
      totalSlots: t({ pt: "Slots totais", en: "Total slots" }),
      loadedSlots: t({ pt: "Slots carregados", en: "Loaded slots" }),
    },

    // ── Estado da impressora ─────────────────────────────────────────────
    status: {
      idle: t({ pt: "Disponível", en: "Available" }),
      printing: t({ pt: "A imprimir", en: "Printing" }),
      error: t({ pt: "Erro", en: "Error" }),
      maintenance: t({ pt: "Manutenção", en: "Maintenance" }),
      offline: t({ pt: "Offline", en: "Offline" }),
    },

    // ── Menu de contexto do card ─────────────────────────────────────────
    contextMenu: {
      markIdle: t({ pt: "Marcar como Disponível", en: "Mark as Available" }),
      markPrinting: t({ pt: "Marcar como A Imprimir", en: "Mark as Printing" }),
      markMaintenance: t({
        pt: "Marcar como Manutenção",
        en: "Mark as Maintenance",
      }),
      markOffline: t({ pt: "Marcar como Offline", en: "Mark as Offline" }),
      addUnit: t({
        pt: "Adicionar AMS / Acessório",
        en: "Add AMS / Accessory",
      }),
      delete: t({ pt: "Eliminar Impressora", en: "Delete Printer" }),
    },

    // ── Card da impressora ───────────────────────────────────────────────
    card: {
      noAccessories: t({
        pt: "Sem acessórios configurados.",
        en: "No accessories configured.",
      }),
      addAccessoryLink: t({
        pt: "+ Adicionar AMS / Acessório",
        en: "+ Add AMS / Accessory",
      }),
      highTemp: t({ pt: "High Temp", en: "High Temp" }),
      totalHours: t({ pt: "h total", en: "h total" }),
    },

    // ── Empty state ──────────────────────────────────────────────────────
    empty: {
      title: t({
        pt: "Ainda não tens impressoras configuradas.",
        en: "No printers configured yet.",
      }),
      description: t({
        pt: "Adiciona a tua primeira máquina para começar a planear produções.",
        en: "Add your first machine to start planning productions.",
      }),
    },

    // ── Dialog: Adicionar Impressora ─────────────────────────────────────
    addPrinterDialog: {
      title: t({ pt: "Adicionar Impressora", en: "Add Printer" }),

      // Passo 1
      step1: {
        model: t({ pt: "Modelo", en: "Model" }),
        modelPlaceholder: t({
          pt: "Seleciona o modelo...",
          en: "Select model...",
        }),
        modelSearch: t({ pt: "Pesquisar modelo...", en: "Search model..." }),
        customName: t({ pt: "Nome personalizado", en: "Custom name" }),
        customNamePlaceholder: t({
          pt: 'ex: "P1S Alpha" ou "Mesa 3"',
          en: 'e.g. "P1S Alpha" or "Table 3"',
        }),
        hourlyCost: t({ pt: "Custo/hora (€)", en: "Cost/hour (€)" }),
        powerWatts: t({ pt: "Potência (W)", en: "Power (W)" }),
      },

      // Passo 2
      step2: {
        description: t({
          pt: "Quantos e quais os sistemas de alimentação de filamento?",
          en: "How many and which filament feeding systems does it have?",
        }),
        accessoryPlaceholder: t({
          pt: "Seleciona acessório...",
          en: "Select accessory...",
        }),
        accessorySearch: t({ pt: "Pesquisar...", en: "Search..." }),
        addButton: t({ pt: "+ Adicionar", en: "+ Add" }),
        slots: t({ pt: "slots", en: "slots" }),
        total: t({ pt: "Total:", en: "Total:" }),
        noAccessories: t({
          pt: "Sem acessórios — filamento direto (1 slot).",
          en: "No accessories — direct filament (1 slot).",
        }),
      },

      // Validação
      validation: {
        nameAndModel: t({
          pt: "Preenche o nome e seleciona o modelo",
          en: "Fill in the name and select the model",
        }),
      },

      // Toast
      toast: {
        success: t({
          pt: "adicionada com sucesso!",
          en: "added successfully!",
        }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },

    // ── Dialog: Adicionar Unidade/AMS ────────────────────────────────────
    addUnitDialog: {
      title: t({ pt: "Adicionar AMS / Acessório", en: "Add AMS / Accessory" }),
      accessoryType: t({ pt: "Tipo de acessório", en: "Accessory type" }),
      accessoryPlaceholder: t({
        pt: "Seleciona o acessório...",
        en: "Select accessory...",
      }),
      accessorySearch: t({ pt: "Pesquisar...", en: "Search..." }),
      customName: t({ pt: "Nome personalizado", en: "Custom name" }),
      customNameOptional: t({ pt: "opcional", en: "optional" }),
      customNamePlaceholder: t({
        pt: "ex: AMS Principal",
        en: "e.g. Main AMS",
      }),
      highTempWarning: t({
        pt: "⚠ Suporta materiais High Temp",
        en: "⚠ Supports High Temp materials",
      }),
      abrasiveWarning: t({
        pt: "⚠ Suporta materiais abrasivos",
        en: "⚠ Supports abrasive materials",
      }),
      slots: t({ pt: "Slots:", en: "Slots:" }),

      // Toast
      toast: {
        success: t({ pt: "Acessório adicionado!", en: "Accessory added!" }),
        noPreset: t({
          pt: "Seleciona um acessório",
          en: "Select an accessory",
        }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },

    // ── Confirmações ─────────────────────────────────────────────────────
    confirm: {
      deletePrinter: t({
        pt: "Eliminar esta impressora? Esta ação não pode ser desfeita.",
        en: "Delete this printer? This action cannot be undone.",
      }),
    },

    // ── Toast mensagens gerais ────────────────────────────────────────────
    toast: {
      deleted: t({ pt: "Impressora eliminada", en: "Printer deleted" }),
      error: t({ pt: "Erro", en: "Error" }),
      statusUpdated: t({ pt: "Estado atualizado", en: "Status updated" }),
    },
  },
} satisfies DeclarationContent;

export default printersContent;
