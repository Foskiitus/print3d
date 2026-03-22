"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { SpoolIQLogo } from "@/components/ui/logo";

type View = "sign-in" | "forgot-password" | "forgot-password-sent";

export default function SignInPage() {
  const { locale } = useParams<{ locale: string }>();
  const content = useIntlayer("sign-in");

  const [view, setView] = useState<View>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(content.errorMessage.value);
    } else {
      router.push(`/${locale}/dashboard`);
      router.refresh();
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&locale=${locale}&next=${encodeURIComponent(`/${locale}/reset-password`)}`,
    });

    if (error) {
      setError(error.message);
    } else {
      setView("forgot-password-sent");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?locale=${locale}`,
      },
    });
  };

  // ─── Ecrã: email enviado ──────────────────────────────────────────────────

  if (view === "forgot-password-sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-8 rounded-xl border border-border bg-card text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {locale === "pt" ? "Email enviado" : "Email sent"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {locale === "pt"
                ? `Enviámos um link para redefinir a tua palavra-passe para `
                : `We sent a password reset link to `}
              <strong>{email}</strong>.
            </p>
          </div>
          <button
            onClick={() => {
              setView("sign-in");
              setError(null);
            }}
            className="text-sm text-primary hover:underline"
          >
            {locale === "pt" ? "Voltar ao login" : "Back to sign in"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Ecrã: esqueci a password ─────────────────────────────────────────────

  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 p-8 rounded-xl border border-border bg-card">
          <div className="flex-1 flex justify-center">
            <SpoolIQLogo className="w-auto" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              {locale === "pt" ? "Recuperar palavra-passe" : "Reset password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {locale === "pt"
                ? "Introduz o teu email e enviamos um link para redefinires a tua palavra-passe."
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="reset-email"
              >
                {content.emailLabel}
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={content.emailPlaceholder.value}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? locale === "pt"
                  ? "A enviar..."
                  : "Sending..."
                : locale === "pt"
                  ? "Enviar link"
                  : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => {
                setView("sign-in");
                setError(null);
              }}
              className="text-primary hover:underline font-medium"
            >
              {locale === "pt" ? "Voltar ao login" : "Back to sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ─── Ecrã: login ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-xl border border-border bg-card">
        <div className="flex-1 flex justify-center">
          <SpoolIQLogo className="w-auto" />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {content.title}
          </h1>
          <p className="text-sm text-muted-foreground">{content.subtitle}</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="email"
            >
              {content.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={content.emailPlaceholder.value}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                {content.passwordLabel}
              </label>
              <button
                type="button"
                onClick={() => {
                  setView("forgot-password");
                  setError(null);
                }}
                className="text-xs text-primary hover:underline"
              >
                {locale === "pt"
                  ? "Esqueceste a palavra-passe?"
                  : "Forgot password?"}
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={content.passwordPlaceholder.value}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? content.submittingButton : content.submitButton}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-2">{content.orDivider}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 px-4 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {content.googleButton}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {content.noAccount}{" "}
          <Link
            href={`/${locale}/sign-up`}
            className="text-primary hover:underline font-medium"
          >
            {content.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
