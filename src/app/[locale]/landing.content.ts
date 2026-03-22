import { t, type DeclarationContent } from "intlayer";

const landingContent = {
  key: "landing",
  content: {
    // ── Hero ─────────────────────────────────────────────────────
    badge: t({
      en: "ERP for 3D Printing Makers",
      pt: "ERP para Makers de Impressão 3D",
    }),
    headline1: t({ en: "Smart management", pt: "Gestão inteligente" }),
    headline2: t({ en: "of 3D printing", pt: "de impressão 3D" }),
    subheadline: t({
      en: "From filament to sale, everything calculated. Track spools, printers, costs and orders in a platform built for serious makers.",
      pt: "Do filamento à venda, tudo calculado. Controla bobinas, impressoras, custos e encomendas numa plataforma feita para quem imprime a sério.",
    }),
    tagline: t({
      en: "Know your costs. Control your spools. Scale your prints.",
      pt: "Know your costs. Control your spools. Scale your prints.",
    }),
    cta_start: t({ en: "Start for free", pt: "Começar grátis" }),
    cta_login: t({ en: "Login", pt: "Login" }),
    social_makers: t({ en: "+200 makers", pt: "+200 makers" }),
    social_rating: t({ en: "4.9/5", pt: "4.9/5" }),
    social_no_card: t({ en: "No credit card", pt: "Sem cartão de crédito" }),

    // ── Features section ─────────────────────────────────────────
    features_badge: t({ en: "Features", pt: "Funcionalidades" }),
    features_title1: t({
      en: "Everything a maker needs,",
      pt: "Tudo o que um maker precisa,",
    }),
    features_title2: t({ en: "in one place", pt: "num só lugar" }),
    features_subtitle: t({
      en: "Print smarter, not harder. From filament control to the final sale.",
      pt: "Print smarter, not harder. Do controlo do filamento à venda final.",
    }),

    // ── Pricing section ──────────────────────────────────────────
    pricing_badge: t({ en: "Simple pricing", pt: "Preços simples" }),
    pricing_title1: t({ en: "Start free,", pt: "Começa grátis," }),
    pricing_title2: t({
      en: " scale whenever you want",
      pt: " escala quando quiseres",
    }),
    pricing_subtitle: t({
      en: "No commitments. Cancel anytime.",
      pt: "Sem compromissos. Cancela quando quiseres.",
    }),

    // ── FAQ section ──────────────────────────────────────────────
    faq_title: t({
      en: "Frequently asked questions",
      pt: "Perguntas frequentes",
    }),

    // ── CTA final ────────────────────────────────────────────────
    cta_final_title: t({
      en: "Ready to print smarter?",
      pt: "Pronto para imprimir com inteligência?",
    }),
    cta_final_sub: t({
      en: "SpoolIQ — Print smarter, not harder. Start free today.",
      pt: "SpoolIQ — Print smarter, not harder. Começa grátis hoje.",
    }),

    // ── Footer ───────────────────────────────────────────────────
    footer_tagline: t({
      en: "From spool to sale, everything calculated.",
      pt: "Da bobina à venda, tudo calculado.",
    }),
    footer_privacy: t({ en: "Privacy", pt: "Privacidade" }),
    footer_terms: t({ en: "Terms", pt: "Termos" }),
    footer_contact: t({ en: "Contact", pt: "Contacto" }),
  },
} satisfies DeclarationContent;

export default landingContent;
