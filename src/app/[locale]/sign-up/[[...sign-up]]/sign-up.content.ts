import { t, type DeclarationContent } from "intlayer";

const signUpContent = {
  key: "sign-up",
  content: {
    title: t({ pt: "Criar conta", en: "Create account" }),
    subtitle: t({
      pt: "Começa a usar o SpoolIQ hoje",
      en: "Start using SpoolIQ today",
    }),
    nameLabel: t({ pt: "Nome", en: "Name" }),
    namePlaceholder: t({ pt: "O teu nome", en: "Your name" }),
    emailLabel: t({ pt: "Email", en: "Email" }),
    emailPlaceholder: t({ pt: "tu@exemplo.com", en: "you@example.com" }),
    passwordLabel: t({ pt: "Password", en: "Password" }),
    passwordPlaceholder: t({
      pt: "Mínimo 8 caracteres",
      en: "Minimum 8 characters",
    }),
    submitButton: t({ pt: "Criar conta", en: "Create account" }),
    submittingButton: t({ pt: "A criar conta…", en: "Creating account…" }),
    orDivider: t({ pt: "ou", en: "or" }),
    googleButton: t({ pt: "Registar com Google", en: "Sign up with Google" }),
    hasAccount: t({ pt: "Já tens conta?", en: "Already have an account?" }),
    loginLink: t({ pt: "Entrar", en: "Sign in" }),
    confirmTitle: t({ pt: "Confirma o teu email", en: "Confirm your email" }),
    confirmMessage: t({
      pt: "Enviámos um link de confirmação para",
      en: "We sent a confirmation link to",
    }),
    confirmSub: t({
      pt: "Clica no link para ativares a tua conta.",
      en: "Click the link to activate your account.",
    }),
    backToLogin: t({ pt: "Voltar ao login", en: "Back to login" }),
  },
} satisfies DeclarationContent;

export default signUpContent;
