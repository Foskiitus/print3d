import { t, type DeclarationContent } from "intlayer";

const dashboardContent = {
  key: "dashboard",
  content: {
    // Page header
    title: t({ pt: "Dashboard", en: "Dashboard" }),
    subtitle: t({ pt: "Últimos 30 dias", en: "Last 30 days" }),

    // Metric cards
    metrics: {
      revenue: t({ pt: "Receita", en: "Revenue" }),
      revenueSub: t({ pt: "margem", en: "margin" }),
      profit: t({ pt: "Lucro", en: "Profit" }),
      profitSub: t({ pt: "após custos", en: "after costs" }),
      unitsProduced: t({ pt: "Unidades produzidas", en: "Units produced" }),
      unitsProducedSub: t({ pt: "últimos 30 dias", en: "last 30 days" }),
      filamentConsumed: t({
        pt: "Filamento consumido",
        en: "Filament consumed",
      }),
      filamentConsumedSub: t({ pt: "em produção", en: "in production" }),
    },

    // Chart titles
    charts: {
      dailyRevenue: t({ pt: "Receita diária (€)", en: "Daily revenue (€)" }),
      dailyProduction: t({
        pt: "Unidades produzidas por dia",
        en: "Units produced per day",
      }),
    },

    // Tooltip labels
    tooltips: {
      revenue: t({ pt: "Receita", en: "Revenue" }),
      units: t({ pt: "Unidades", en: "Units" }),
    },

    // List section titles
    lists: {
      topProducts: t({
        pt: "Produtos mais vendidos",
        en: "Top selling products",
      }),
      stock: t({ pt: "Stock atual", en: "Current stock" }),
      filamentStock: t({ pt: "Filamento em stock", en: "Filament in stock" }),
    },

    // Empty states
    empty: {
      noSales: t({ pt: "Sem vendas ainda", en: "No sales yet" }),
      noProducts: t({ pt: "Sem produtos", en: "No products" }),
      noSpools: t({ pt: "Sem bobines", en: "No spools" }),
    },

    // Units
    units: {
      units: t({ pt: "un.", en: "units" }),
      grams: t({ pt: "g", en: "g" }),
    },
  },
} satisfies DeclarationContent;

export default dashboardContent;
