import { t, type DeclarationContent } from "intlayer";

const pricingContent = {
  key: "pricing",
  content: {
    hobby_name: t({ en: "Hobby", pt: "Hobby" }),
    hobby_desc: t({
      en: "To get started and try the platform.",
      pt: "Para começar e experimentar a plataforma.",
    }),
    hobby_cta: t({ en: "Start for free", pt: "Começar grátis" }),

    pro_name: t({ en: "Pro", pt: "Pro" }),
    pro_desc: t({
      en: "For serious makers who need to grow without limits.",
      pt: "Para makers sérios que precisam de crescer sem limites.",
    }),
    pro_cta: t({ en: "Start Pro", pt: "Começar Pro" }),
    pro_badge: t({ en: "Most popular", pt: "Mais popular" }),

    per_month: t({ en: "/ month", pt: "/ mês" }),
    stripe_note: t({
      en: "Secure payments via Stripe. Cancel anytime, no fees.",
      pt: "Pagamentos seguros via Stripe. Cancela a qualquer momento, sem taxas.",
    }),

    hobby_f1: t({ en: "Up to 2 printers", pt: "Até 2 impressoras" }),
    hobby_f2: t({
      en: "Up to 10 spools in inventory",
      pt: "Até 10 bobinas em inventário",
    }),
    hobby_f3: t({
      en: "Basic order management",
      pt: "Gestão básica de encomendas",
    }),
    hobby_f4: t({ en: "Cost dashboard", pt: "Dashboard de custos" }),
    hobby_f5: t({ en: "QR Code scan", pt: "Scan QR Code" }),
    hobby_f6: t({ en: "PWA app (mobile)", pt: "Aplicação PWA (mobile)" }),
    hobby_f7: t({ en: "Email support", pt: "Suporte por email" }),

    pro_f1: t({ en: "Unlimited printers", pt: "Impressoras ilimitadas" }),
    pro_f2: t({
      en: "Unlimited spools & stock",
      pt: "Bobinas & stock ilimitado",
    }),
    pro_f3: t({ en: "Unlimited orders", pt: "Encomendas ilimitadas" }),
    pro_f4: t({
      en: "Advanced analytics & reports",
      pt: "Analytics avançado & relatórios",
    }),
    pro_f5: t({ en: "CSV / PDF export", pt: "Exportação CSV / PDF" }),
    pro_f6: t({
      en: "Multi-language (PT, EN, ES)",
      pt: "Multi-idioma (PT, EN, ES)",
    }),
    pro_f7: t({
      en: "Stripe integration (invoicing)",
      pt: "Integração Stripe (faturação)",
    }),
    pro_f8: t({ en: "Priority support", pt: "Suporte prioritário" }),
    pro_f9: t({
      en: "Automatic Supabase backups",
      pt: "Backups automáticos Supabase",
    }),
  },
} satisfies DeclarationContent;

export default pricingContent;
