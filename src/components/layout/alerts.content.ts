import { t, type DeclarationContent } from "intlayer";

const alertsContent = {
  key: "alerts",
  content: {
    // ── Product alerts dropdown ──────────────────────────────────
    products: {
      title: t({ en: "Product stock", pt: "Stock de produtos" }),
      empty: t({
        en: "No products with low stock.",
        pt: "Nenhum produto com stock baixo.",
      }),
      stockInfo: t({
        en: "un. in stock · alert below",
        pt: "un. em stock · alerta abaixo de",
      }),
    },

    // ── Spool alerts dropdown ────────────────────────────────────
    filaments: {
      title: t({ en: "Filaments", pt: "Filamentos" }),
      empty: t({
        en: "No spools with low stock.",
        pt: "Nenhuma bobine com stock baixo.",
      }),
      remaining: t({
        en: "g total · alert below",
        pt: "g no total · alerta abaixo de",
      }),
      spools: t({ en: "spools", pt: "bobines" }),
    },

    // ── Shared ───────────────────────────────────────────────────
    alertCount: t({ en: "alert(s)", pt: "alerta(s)" }),
    viewAll: t({ en: "View all alerts", pt: "Ver todos os alertas" }),
  },
} satisfies DeclarationContent;

export default alertsContent;
