"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";
import type { LocalesValues } from "intlayer";

const SUPPORT_EMAIL = "support@spooliq.app";
const INSTAGRAM_URL = "https://instagram.com/spooliq";
const FACEBOOK_URL = "https://facebook.com/spooliq";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function ContactPage() {
  const { locale } = useParams<{ locale: string }>();
  const content = useIntlayer("contact");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${SITE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError(content.form.errorGeneric.value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-theme bg-background text-foreground min-h-screen flex flex-col">
      <LandingHeader locale={locale as LocalesValues} />

      <main className="flex-1 pt-16">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16 space-y-3">
            <h1
              className="font-display font-bold text-theme"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                letterSpacing: "-0.04em",
              }}
            >
              {content.hero.title}
            </h1>
            <p className="text-navy-400 text-lg max-w-xl mx-auto leading-relaxed">
              {content.hero.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-10 items-start">
            {/* Formulário */}
            <div className="md:col-span-3 card">
              <h2
                className="font-display font-semibold text-theme text-lg mb-6"
                style={{ letterSpacing: "-0.02em" }}
              >
                {content.form.title}
              </h2>

              {done ? (
                <div className="text-center py-8 space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-brand-400"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  </div>
                  <p
                    className="font-display font-semibold text-theme"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {content.form.successTitle}
                  </p>
                  <p className="text-sm text-navy-400">
                    {content.form.successBody}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        className="text-sm font-medium text-navy-300"
                        htmlFor="name"
                      >
                        {content.form.nameLabel}
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={content.form.namePlaceholder.value}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="text-sm font-medium text-navy-300"
                        htmlFor="contact-email"
                      >
                        {content.form.emailLabel}
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={content.form.emailPlaceholder.value}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-medium text-navy-300"
                      htmlFor="subject"
                    >
                      {content.form.subjectLabel}
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={content.form.subjectPlaceholder.value}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-medium text-navy-300"
                      htmlFor="message"
                    >
                      {content.form.messageLabel}
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={content.form.messagePlaceholder.value}
                      required
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors resize-none"
                    />
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-2.5"
                  >
                    {loading ? content.form.submitting : content.form.submit}
                  </button>
                </form>
              )}
            </div>

            {/* Social + email */}
            <div className="md:col-span-2 space-y-4">
              <h2
                className="font-display font-semibold text-theme text-lg"
                style={{ letterSpacing: "-0.02em" }}
              >
                {content.social.title}
              </h2>

              {/* Email */}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="card flex items-center gap-4 hover:border-brand-500/30 hover:bg-brand-500/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-400"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-theme">
                    {content.social.email}
                  </p>
                  <p className="text-xs text-dark-subtle">{SUPPORT_EMAIL}</p>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="card flex items-center gap-4 hover:border-brand-500/30 hover:bg-brand-500/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-400"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-theme">
                    {content.social.instagram}
                  </p>
                  <p className="text-xs text-dark-subtle">@spooliq</p>
                </div>
              </a>

              {/* Facebook */}
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="card flex items-center gap-4 hover:border-brand-500/30 hover:bg-brand-500/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-400"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-theme">
                    {content.social.facebook}
                  </p>
                  <p className="text-xs text-dark-subtle">SpoolIQ</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter locale={locale as LocalesValues} />
    </div>
  );
}
