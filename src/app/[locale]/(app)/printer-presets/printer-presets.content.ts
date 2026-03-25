import { t, type DeclarationContent } from "intlayer";

const printerPresetsContent = {
  key: "printer-presets",
  content: {
    page: {
      title: t({ en: "Global Printers", pt: "Impressoras Globais" }),
      heading: t({ en: "Printer Presets", pt: "Presets de Impressoras" }),
      description: t({
        en: "Manage global printer presets available to all users.",
        pt: "Gerir presets de impressoras globais disponíveis para todos.",
      }),
    },
    dialog: {
      triggerButton: t({ en: "New Printer", pt: "Nova Impressora" }),
      title: t({ en: "Add Global Printer", pt: "Adicionar Impressora Global" }),
      fields: {
        brand: t({ en: "Brand", pt: "Marca" }),
        model: t({ en: "Model", pt: "Modelo" }),
      },
      submitButton: t({ en: "Add Printer", pt: "Adicionar Impressora" }),
      submitting: t({ en: "Adding...", pt: "A adicionar..." }),
    },
    table: {
      brand: t({ en: "Brand", pt: "Marca" }),
      model: t({ en: "Model", pt: "Modelo" }),
      empty: t({
        en: "No global printers found.",
        pt: "Nenhuma impressora global encontrada.",
      }),
    },
    toast: {
      created: t({ en: "Printer added!", pt: "Impressora adicionada!" }),
      deleted: t({ en: "Printer deleted.", pt: "Impressora apagada." }),
      createError: t({
        en: "Error adding printer",
        pt: "Erro ao adicionar impressora",
      }),
      deleteError: t({
        en: "Error deleting printer",
        pt: "Erro ao apagar impressora",
      }),
    },
  },
} satisfies DeclarationContent;

export default printerPresetsContent;
