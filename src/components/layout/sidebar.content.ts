import { t, type DeclarationContent } from "intlayer";

const sidebarContent = {
  key: "sidebar",
  content: {
    groups: {
      management: t({ pt: "Gestão", en: "Management" }),
      others: t({ pt: "Outros", en: "Others" }),
      admin: t({ pt: "Administração", en: "Administration" }),
    },
    nav: {
      dashboard: t({ pt: "Dashboard", en: "Dashboard" }),
      filaments: t({ pt: "Filamentos", en: "Filaments" }),
      products: t({ pt: "Produtos", en: "Products" }),
      stock: t({ pt: "Stock", en: "Stock" }),
      production: t({ pt: "Produção", en: "Production" }),
      sales: t({ pt: "Vendas", en: "Sales" }),
      printers: t({ pt: "Impressoras", en: "Printers" }),
      customers: t({ pt: "Clientes", en: "Customers" }),
      export: t({ pt: "Exportação", en: "Export" }),
      alerts: t({ pt: "Alertas", en: "Alerts" }),
      settings: t({ pt: "Configurações", en: "Settings" }),
      billing: t({ pt: "Subscrição", en: "Billing" }),
      users: t({ pt: "Utilizadores", en: "Users" }),
    },
    roles: {
      admin: t({ pt: "Admin", en: "Admin" }),
      viewer: t({ pt: "Viewer", en: "Viewer" }),
    },
    signOut: t({ pt: "Sair", en: "Sign out" }),
  },
} satisfies DeclarationContent;

export default sidebarContent;
