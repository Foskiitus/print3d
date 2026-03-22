import { t, type DeclarationContent } from "intlayer";

const contactContent = {
  key: "contact",
  content: {
    meta: {
      title: t({ en: "Contact", pt: "Contacto" }),
      description: t({
        en: "Get in touch with the SpoolIQ team.",
        pt: "Entra em contacto com a equipa SpoolIQ.",
      }),
    },

    hero: {
      title: t({ en: "Get in touch", pt: "Fala connosco" }),
      subtitle: t({
        en: "Have a question, suggestion or just want to say hello? We'd love to hear from you.",
        pt: "Tens uma dúvida, sugestão ou apenas queres dizer olá? Adoraríamos ouvir-te.",
      }),
    },

    form: {
      title: t({ en: "Send us a message", pt: "Envia-nos uma mensagem" }),
      nameLabel: t({ en: "Name", pt: "Nome" }),
      namePlaceholder: t({ en: "Your name", pt: "O teu nome" }),
      emailLabel: t({ en: "Email", pt: "Email" }),
      emailPlaceholder: t({ en: "your@email.com", pt: "o-teu@email.com" }),
      subjectLabel: t({ en: "Subject", pt: "Assunto" }),
      subjectPlaceholder: t({
        en: "How can we help?",
        pt: "Como podemos ajudar?",
      }),
      messageLabel: t({ en: "Message", pt: "Mensagem" }),
      messagePlaceholder: t({
        en: "Tell us more...",
        pt: "Conta-nos mais...",
      }),
      submit: t({ en: "Send message", pt: "Enviar mensagem" }),
      submitting: t({ en: "Sending...", pt: "A enviar..." }),
      successTitle: t({ en: "Message sent!", pt: "Mensagem enviada!" }),
      successBody: t({
        en: "Thanks for reaching out. We'll get back to you as soon as possible.",
        pt: "Obrigado pelo contacto. Responderemos o mais brevemente possível.",
      }),
      errorGeneric: t({
        en: "Something went wrong. Please try again or email us directly.",
        pt: "Ocorreu um erro. Tenta novamente ou envia-nos um email directamente.",
      }),
    },

    social: {
      title: t({ en: "Find us online", pt: "Encontra-nos online" }),
      instagram: t({
        en: "Follow us on Instagram",
        pt: "Segue-nos no Instagram",
      }),
      facebook: t({ en: "Follow us on Facebook", pt: "Segue-nos no Facebook" }),
      email: t({ en: "Email us directly", pt: "Envia-nos um email" }),
    },
  },
} satisfies DeclarationContent;

export default contactContent;
