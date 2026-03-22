import { t, type DeclarationContent } from "intlayer";

const faqContent = {
  key: "faq",
  content: {
    q1: t({
      en: "Is the Hobby plan really free forever?",
      pt: "O plano Hobby é mesmo gratuito para sempre?",
    }),
    a1: t({
      en: "Yes. The Hobby plan is free with no time limit. You can use it indefinitely with up to 2 printers and 10 spools.",
      pt: "Sim. O plano Hobby é gratuito sem limite de tempo. Podes usá-lo indefinidamente com até 2 impressoras e 10 bobinas.",
    }),
    q2: t({
      en: "Can I upgrade from Hobby to Pro at any time?",
      pt: "Posso migrar do Hobby para o Pro a qualquer momento?",
    }),
    a2: t({
      en: "Yes, the upgrade is instant. All your data is preserved and you get immediate access to all Pro features.",
      pt: "Sim, o upgrade é instantâneo. Todos os teus dados são preservados e tens acesso imediato a todas as funcionalidades Pro.",
    }),
    q3: t({
      en: "Is my data safe?",
      pt: "Os meus dados ficam seguros?",
    }),
    a3: t({
      en: "The platform uses Supabase (PostgreSQL) with automatic backups, and files are stored in Supabase Storage with private per-user access.",
      pt: "A plataforma usa Supabase (PostgreSQL) com backups automáticos, e os ficheiros são guardados no Supabase Storage com acesso privado por utilizador.",
    }),
    q4: t({
      en: "Does it work on mobile?",
      pt: "Funciona no telemóvel?",
    }),
    a4: t({
      en: "Yes. SpoolIQ is a PWA (Progressive Web App) — you can install it on your phone and use it offline. Includes QR Code scanning via camera.",
      pt: "Sim. O SpoolIQ é uma PWA (Progressive Web App) — podes instalar no telemóvel e usar offline. Inclui scan de QR Code pela câmara.",
    }),
  },
} satisfies DeclarationContent;

export default faqContent;
