"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { SpoolIQLogo } from "@/components/ui/logo";

export default function ResetPasswordPage() {
  const { locale } = useParams<{ locale: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const t = {
    pt: {
      title: "Nova palavra-passe",
      subtitle: "Escolhe uma nova palavra-passe para a tua conta.",
      passwordLabel: "Nova palavra-passe",
      passwordPlaceholder: "Mínimo 8 caracteres",
      confirmLabel: "Confirmar palavra-passe",
      confirmPlaceholder: "Repete a palavra-passe",
      submit: "Guardar palavra-passe",
      submitting: "A guardar...",
      errorMatch: "As palavras-passe não coincidem.",
      errorMin: "A palavra-passe deve ter pelo menos 8 caracteres.",
      errorGeneric: "Ocorreu um erro. Tenta novamente.",
    },
    en: {
      title: "New password",
      subtitle: "Choose a new password for your account.",
      passwordLabel: "New password",
      passwordPlaceholder: "Minimum 8 characters",
      confirmLabel: "Confirm password",
      confirmPlaceholder: "Repeat your password",
      submit: "Save password",
      submitting: "Saving...",
      errorMatch: "Passwords do not match.",
      errorMin: "Password must be at least 8 characters.",
      errorGeneric: "Something went wrong. Please try again.",
    },
  };

  const c = t[locale as keyof typeof t] ?? t.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(c.errorMin);
      return;
    }

    if (password !== confirm) {
      setError(c.errorMatch);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(c.errorGeneric);
      setLoading(false);
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-xl border border-border bg-card">
        <div className="flex-1 flex justify-center">
          <SpoolIQLogo className="w-auto" />
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">{c.title}</h1>
          <p className="text-sm text-muted-foreground">{c.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="password"
            >
              {c.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={c.passwordPlaceholder}
              minLength={8}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="confirm"
            >
              {c.confirmLabel}
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={c.confirmPlaceholder}
              minLength={8}
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
            {loading ? c.submitting : c.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
