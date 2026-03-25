import { t, type DeclarationContent } from "intlayer";

const sidebarContent = {
  key: "sidebar",
  content: {
    nav: {
      dashboard: t({ pt: "Dashboard", en: "Dashboard" }),
      inventory: t({ pt: "Inventário", en: "Inventory" }),
      catalog: t({ pt: "Produtos", en: "Products" }),
      components: t({ pt: "Componentes", en: "Components" }),
      production: t({ pt: "Produção", en: "Production" }),
      workshop: t({ pt: "A Minha Oficina", en: "My Workshop" }),
      sales: t({ pt: "Encomendas", en: "Orders" }),
      customers: t({ pt: "Clientes", en: "Customers" }),
      // Configuração
      profile: t({ pt: "A Minha Conta", en: "My Account" }),
      admin: t({ pt: "Painel Admin", en: "Admin Panel" }),
    },
    roles: {
      admin: t({ pt: "Admin", en: "Admin" }),
      user: t({ pt: "Utilizador", en: "User" }),
    },
    signOut: t({ pt: "Sair", en: "Sign out" }),
  },
} satisfies DeclarationContent;

export default sidebarContent;
