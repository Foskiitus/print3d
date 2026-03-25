import { t, type DeclarationContent } from "intlayer";

const adminContent = {
  key: "admin",
  content: {
    page: {
      title: t({ pt: "Painel Admin", en: "Admin Panel" }),
      heading: t({ pt: "Painel Admin", en: "Admin Panel" }),
      description: t({
        pt: "Gestão de presets globais e utilizadores do sistema.",
        en: "Manage global presets and system users.",
      }),
    },
    tabs: {
      hardware: t({ pt: "Presets de Hardware", en: "Hardware Presets" }),
      materials: t({ pt: "Presets de Materiais", en: "Material Presets" }),
      users: t({ pt: "Utilizadores", en: "Users" }),
    },
    printerPresets: {
      addButton: t({ pt: "Nova Impressora", en: "New Printer" }),
      dialogTitle: t({
        pt: "Adicionar Impressora Global",
        en: "Add Global Printer",
      }),
      brand: t({ pt: "Marca", en: "Brand" }),
      model: t({ pt: "Modelo", en: "Model" }),
      powerWatts: t({ pt: "Potência (W)", en: "Power (W)" }),
      hourlyCost: t({ pt: "Custo/hora (€)", en: "Cost/hour (€)" }),
      empty: t({ pt: "Nenhuma impressora global.", en: "No global printers." }),
      submit: t({ pt: "Adicionar", en: "Add" }),
      submitting: t({ pt: "A adicionar...", en: "Adding..." }),
      toast: {
        created: t({ pt: "Impressora adicionada!", en: "Printer added!" }),
        deleted: t({ pt: "Impressora apagada.", en: "Printer deleted." }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },
    globalFilaments: {
      addButton: t({ pt: "Novo Filamento", en: "New Filament" }),
      dialogTitle: t({
        pt: "Adicionar Filamento Global",
        en: "Add Global Filament",
      }),
      brand: t({ pt: "Marca", en: "Brand" }),
      material: t({ pt: "Material", en: "Material" }),
      colorName: t({ pt: "Nome da Cor", en: "Color Name" }),
      colorHex: t({ pt: "Cor (Hex)", en: "Color (Hex)" }),
      spoolWeight: t({ pt: "Peso do rolo (g)", en: "Spool weight (g)" }),
      empty: t({ pt: "Nenhum filamento global.", en: "No global filaments." }),
      submit: t({ pt: "Adicionar", en: "Add" }),
      submitting: t({ pt: "A adicionar...", en: "Adding..." }),
      toast: {
        created: t({ pt: "Filamento adicionado!", en: "Filament added!" }),
        deleted: t({ pt: "Filamento apagado.", en: "Filament deleted." }),
        error: t({ pt: "Erro", en: "Error" }),
      },
    },
    users: {
      addButton: t({ pt: "Novo Utilizador", en: "New User" }),
      dialogTitle: t({ pt: "Criar Utilizador", en: "Create User" }),
      name: t({ pt: "Nome", en: "Name" }),
      email: t({ pt: "Email", en: "Email" }),
      password: t({ pt: "Password", en: "Password" }),
      role: t({ pt: "Role", en: "Role" }),
      plan: t({ pt: "Plano", en: "Plan" }),
      createdAt: t({ pt: "Criado em", en: "Created at" }),
      empty: t({ pt: "Nenhum utilizador.", en: "No users." }),
      submit: t({ pt: "Criar", en: "Create" }),
      submitting: t({ pt: "A criar...", en: "Creating..." }),
      noName: t({ pt: "Sem nome", en: "No name" }),
      toast: {
        created: t({ pt: "Utilizador criado!", en: "User created!" }),
        deleted: t({ pt: "Utilizador apagado.", en: "User deleted." }),
        error: t({ pt: "Erro", en: "Error" }),
        confirmDelete: t({
          pt: "Tens a certeza que queres apagar este utilizador?",
          en: "Are you sure you want to delete this user?",
        }),
      },
    },
  },
} satisfies DeclarationContent;

export default adminContent;
