import { t, type DeclarationContent } from "intlayer";

const settingsContent = {
  key: "settings",
  content: {
    // ── Page (page.tsx) ──────────────────────────────────────────
    page: {
      title: t({ en: "Settings", pt: "Configurações" }),
      heading: t({ en: "Settings", pt: "Configurações" }),
      description: t({
        en: "Manage categories and extras for your products.",
        pt: "Gerencie categorias e extras para os seus produtos.",
      }),
    },

    // ── Mensagens (Toasts) ───────────────────────────────────────
    messages: {
      deleteCategorySuccess: t({
        en: "Category deleted successfully",
        pt: "Categoria eliminada com sucesso",
      }),
      deleteCategoryError: t({
        en: "Error deleting category",
        pt: "Erro ao eliminar a categoria",
      }),
      deleteExtraSuccess: t({
        en: "Extra deleted successfully",
        pt: "Extra eliminado com sucesso",
      }),
      deleteExtraError: t({
        en: "Error deleting o extra",
        pt: "Erro ao eliminar o extra",
      }),
      confirmDelete: t({ en: "Are you sure?", pt: "Tem a certeza?" }),
      presetAdded: t({ en: "Preset added!", pt: "Preset adicionado!" }),
      presetDeleted: t({ en: "Preset deleted!", pt: "Preset eliminado!" }),
      presetDeleteError: t({
        en: "Error deleting preset",
        pt: "Erro ao eliminar o preset",
      }),
    },

    // ── Personal Preferences ─────────────────────────────────────
    preferences: {
      title: t({ en: "Personal Preferences", pt: "Preferências Pessoais" }),
      description: t({
        en: "Individual settings — each user defines their own values.",
        pt: "Configurações individuais — cada utilizador define os seus próprios valores.",
      }),
    },

    // ── Theme ────────────────────────────────────────────────────
    theme: {
      label: t({ en: "Interface theme", pt: "Tema da interface" }),
      description: t({
        en: "Choose between dark and light mode. The preference is saved in your browser.",
        pt: "Escolhe entre o modo escuro e claro. A preferência é guardada no browser.",
      }),
      dark: t({ en: "Dark", pt: "Escuro" }),
      light: t({ en: "Light", pt: "Claro" }),
    },

    // ── Locale ───────────────────────────────────────────────────
    locale: {
      label: t({ en: "Language", pt: "Idioma" }),
      description: t({
        en: "Change the interface language. The change is immediate.",
        pt: "Altera o idioma da interface. A mudança é imediata.",
      }),
      portuguese: t({ en: "Portuguese", pt: "Português" }),
      english: t({ en: "English", pt: "English" }),
    },

    // ── Electricity Price ────────────────────────────────────────
    electricity: {
      label: t({ en: "Electricity price", pt: "Preço da eletricidade" }),
      description: t({
        en: "Used to calculate the energy cost for each production. The default value is 0.20€/kWh.",
        pt: "Usado para calcular o custo de energia em cada produção. O valor padrão é 0.20€/kWh.",
      }),
      unit: t({ en: "€/kWh", pt: "€/kWh" }),
      save: t({ en: "Save", pt: "Guardar" }),
      saving: t({ en: "Saving...", pt: "A guardar..." }),
      saved: t({
        en: "Electricity price saved!",
        pt: "Preço de eletricidade guardado!",
      }),
      invalidValue: t({ en: "Invalid value", pt: "Valor inválido" }),
    },

    // ── Platform Settings (Admin) ────────────────────────────────
    platform: {
      title: t({
        en: "Platform Settings",
        pt: "Configurações da Plataforma",
      }),
      description: t({
        en: "Global settings that affect all users on the platform.",
        pt: "Configurações globais que afetam todos os utilizadores da plataforma.",
      }),
      admin: t({ en: "Admin", pt: "Admin" }),
    },

    // ── Upload Limit ─────────────────────────────────────────────
    uploadLimit: {
      label: t({
        en: "File upload limit",
        pt: "Limite de upload de ficheiros",
      }),
      description: t({
        en: "Maximum file size allowed for .3mf and .stl files. Absolute maximum: 500 MB.",
        pt: "Tamanho máximo permitido para ficheiros .3mf e .stl. Máximo absoluto: 500 MB.",
      }),
      unit: t({ en: "MB", pt: "MB" }),
      save: t({ en: "Save", pt: "Guardar" }),
      saving: t({ en: "Saving...", pt: "A guardar..." }),
      saved: t({ en: "Upload limit saved!", pt: "Limite de upload guardado!" }),
      invalidValue: t({
        en: "Invalid value. Must be between 1 and 500 MB.",
        pt: "Valor inválido. Deve estar entre 1 e 500 MB.",
      }),
    },

    // ── Filament Presets (Admin) ─────────────────────────────────
    filament: {
      title: t({ en: "Filament Presets", pt: "Presets de Filamentos" }),
      description: t({
        en: "Global list of brands, materials and colors available as suggestions when registering filaments.",
        pt: "Lista global de marcas, materiais e cores disponíveis como sugestões ao registar filamentos.",
      }),
      admin: t({ en: "Admin", pt: "Admin" }),
      add: t({ en: "Add preset", pt: "Adicionar preset" }),
      addButton: t({ en: "Add Preset", pt: "Adicionar Preset" }),
      adding: t({ en: "Adding...", pt: "A adicionar..." }),
      added: t({ en: "Preset added!", pt: "Preset adicionado!" }),
      deleted: t({ en: "Preset deleted", pt: "Preset eliminado" }),
      deleteError: t({ en: "Error deleting preset", pt: "Erro ao eliminar" }),
      deleteConfirm: t({
        en: "Delete this preset?",
        pt: "Eliminar este preset?",
      }),
      noPresets: t({
        en: "No presets created yet.",
        pt: "Nenhum preset criado ainda.",
      }),
      brand: t({ en: "Brand", pt: "Marca" }),
      brandPlaceholder: t({ en: "Ex: Bambu Lab", pt: "Ex: Bambu Lab" }),
      material: t({ en: "Material", pt: "Material" }),
      materialPlaceholder: t({ en: "Ex: PLA Basic", pt: "Ex: PLA Basic" }),
      colorName: t({ en: "Color name", pt: "Nome da cor" }),
      colorNamePlaceholder: t({ en: "Ex: Black", pt: "Ex: Preto" }),
      colorVisual: t({ en: "Visual color", pt: "Cor visual" }),
    },

    // ── Categories ───────────────────────────────────────────────
    categories: {
      title: t({ en: "Categories", pt: "Categorias" }),
      empty: t({
        en: "No categories created.",
        pt: "Nenhuma categoria criada.",
      }),
      emptyDescription: t({
        en: "Create categories to organize your products.",
        pt: "Cria categorias para organizar os teus produtos.",
      }),
      products: t({ en: "product(s)", pt: "produto(s)" }),
      deleteConfirm: t({
        en: "Delete this category? Associated products will have no category.",
        pt: "Eliminar esta categoria? Os produtos associados ficarão sem categoria.",
      }),
      deleted: t({ en: "Category deleted", pt: "Categoria eliminada" }),
      deleteError: t({ en: "Error deleting category", pt: "Erro ao eliminar" }),
    },

    // ── Extras ───────────────────────────────────────────────────
    extras: {
      title: t({ en: "Extras", pt: "Extras" }),
      empty: t({ en: "No extras created.", pt: "Nenhum extra criado." }),
      emptyDescription: t({
        en: "Add extra materials such as chains, screws, glue, etc.",
        pt: "Adiciona materiais extra como correntes, parafusos, cola, etc.",
      }),
      products: t({ en: "product(s)", pt: "produto(s)" }),
      deleteConfirm: t({
        en: "Delete this extra?",
        pt: "Eliminar este extra?",
      }),
      deleted: t({ en: "Extra deleted", pt: "Extra eliminado" }),
      deleteError: t({ en: "Error deleting extra", pt: "Erro ao eliminar" }),
    },

    // ── Common ───────────────────────────────────────────────────
    common: {
      error: t({ en: "Error", pt: "Erro" }),
    },
  },
} satisfies DeclarationContent;

export default settingsContent;
