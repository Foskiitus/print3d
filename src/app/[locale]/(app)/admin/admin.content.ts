import { t, type DeclarationContent } from "intlayer";

const adminContent = {
  key: "admin",
  content: {
    page: {
      title: t({ pt: "Painel Admin", en: "Admin Panel" }),
      heading: t({ pt: "Painel de Administração", en: "Administration Panel" }),
      description: t({
        pt: "Gestão de utilizadores, presets de hardware e catálogo de materiais.",
        en: "Manage users, hardware presets and materials catalogue.",
      }),
    },
    tabs: {
      users: t({ pt: "Utilizadores", en: "Users" }),
      hardware: t({ pt: "Presets de Hardware", en: "Hardware Presets" }),
      materials: t({ pt: "Presets de Materiais", en: "Material Presets" }),
    },
    accessDenied: t({
      pt: "Acesso negado. Esta área é exclusiva para administradores.",
      en: "Access denied. This area is for administrators only.",
    }),
  },
} satisfies DeclarationContent;

export default adminContent;
