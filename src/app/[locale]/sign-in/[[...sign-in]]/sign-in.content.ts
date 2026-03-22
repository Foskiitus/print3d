import { t, type DeclarationContent } from "intlayer";

const signInContent = {
  key: "sign-in",
  content: {
    title: t({ pt: "Entrar", en: "Sign in" }),
    subtitle: t({
      pt: "Bem-vindo de volta ao SpoolIQ",
      en: "Welcome back to SpoolIQ",
    }),
    emailLabel: t({ pt: "Email", en: "Email" }),
    emailPlaceholder: t({ pt: "tu@exemplo.com", en: "you@example.com" }),
    passwordLabel: t({ pt: "Password", en: "Password" }),
    passwordPlaceholder: "••••••••",
    submitButton: t({ pt: "Entrar", en: "Sign in" }),
    submittingButton: t({ pt: "A entrar…", en: "Signing in…" }),
    errorMessage: t({
      pt: "Email ou password incorretos.",
      en: "Incorrect email or password.",
    }),
    orDivider: t({ pt: "ou", en: "or" }),
    googleButton: t({ pt: "Entrar com Google", en: "Sign in with Google" }),
    noAccount: t({ pt: "Não tens conta?", en: "Don't have an account?" }),
    registerLink: t({ pt: "Registar", en: "Register" }),
  },
} satisfies DeclarationContent;

export default signInContent;
