import { t, type DeclarationContent } from "intlayer";

const alertsContent = {
  key: "alerts",
  content: {
    title: t({ pt: "Alertas de Stock", en: "Stock Alerts" }),
    subtitle: t({
      pt: "Produtos e bobines abaixo do limite definido.",
      en: "Products and spools below the defined threshold.",
    }),
    activeBadge: t({ pt: "alerta(s) ativo(s)", en: "active alert(s)" }),

    allClear: {
      title: t({ pt: "Tudo em ordem!", en: "All clear!" }),
      sub: t({
        pt: "Nenhum produto ou bobine abaixo do limite de alerta.",
        en: "No products or spools below the alert threshold.",
      }),
    },

    sections: {
      products: t({ pt: "Produtos", en: "Products" }),
      spools: t({ pt: "Bobines de filamento", en: "Filament spools" }),
    },

    stock: {
      units: t({ pt: "unidades", en: "units" }),
      inStock: t({ pt: "em stock", en: "in stock" }),
      alertBelow: t({ pt: "alerta abaixo de", en: "alert below" }),
      un: t({ pt: "un.", en: "units" }),
      total: t({ pt: "no total", en: "total" }),
      spoolsSuffix: t({ pt: "bobines", en: "spools" }),
      default: t({ pt: "padrão", en: "default" }),
    },

    links: {
      viewProduct: t({ pt: "Ver produto", en: "View product" }),
      viewFilaments: t({ pt: "Ver filamentos", en: "View filaments" }),
    },

    howTo: {
      title: t({
        pt: "Como configurar alertas",
        en: "How to configure alerts",
      }),
      products: t({
        pt: 'Para produtos: abre o produto e define o campo "Alerta de stock mínimo" na edição.',
        en: 'For products: open the product and set the "Minimum stock alert" field when editing.',
      }),
      spools: t({
        pt: 'Para bobines: abre o filamento e define o campo "Alerta de stock mínimo" na bobine.',
        en: 'For spools: open the filament and set the "Minimum stock alert" field on the spool.',
      }),
    },
  },
} satisfies DeclarationContent;

export default alertsContent;
