import { t, type DeclarationContent } from "intlayer";

const globalFilamentsContent = {
  key: "global-filaments",
  content: {
    page: {
      title: t({ en: "Global Filaments", pt: "Filamentos Globais" }),
      heading: t({ en: "Filament Catalog", pt: "Catálogo de Filamentos" }),
      description: t({
        en: "Manage global filament presets available to all users.",
        pt: "Gerir presets de filamentos globais disponíveis para todos.",
      }),
    },
    dialog: {
      triggerButton: t({ en: "New Filament", pt: "Novo Filamento" }),
      title: t({ en: "Add Global Filament", pt: "Adicionar Filamento Global" }),
      fields: {
        brand: t({ en: "Brand", pt: "Marca" }),
        material: t({ en: "Material", pt: "Material" }),
        colorName: t({ en: "Color Name", pt: "Nome da Cor" }),
        colorCode: t({ en: "Color Code (Hex)", pt: "Código da Cor" }),
      },
      submitButton: t({ en: "Add Filament", pt: "Adicionar Filamento" }),
      submitting: t({ en: "Adding...", pt: "A adicionar..." }),
    },
    table: {
      brand: t({ en: "Brand", pt: "Marca" }),
      material: t({ en: "Material", pt: "Material" }),
      color: t({ en: "Color", pt: "Cor" }),
      empty: t({
        en: "No global filaments found.",
        pt: "Nenhum filamento global encontrado.",
      }),
    },
    toast: {
      created: t({ en: "Filament added!", pt: "Filamento adicionado!" }),
      deleted: t({ en: "Filament deleted.", pt: "Filamento apagado." }),
      createError: t({
        en: "Error adding filament",
        pt: "Erro ao adicionar filamento",
      }),
      deleteError: t({
        en: "Error deleting filament",
        pt: "Erro ao apagar filamento",
      }),
    },
  },
} satisfies DeclarationContent;

export default globalFilamentsContent;
