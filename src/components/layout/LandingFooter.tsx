"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { SpoolIQLogo } from "@/components/ui/logo";

const LOCALES: { value: LocalesValues; flag: string; label: string }[] = [
  { value: "pt", flag: "🇵🇹", label: "Português" },
  { value: "en", flag: "🇬🇧", label: "English" },
  { value: "es", flag: "🇪🇸", label: "Español" },
];

export function LandingFooter({ locale }: { locale: LocalesValues }) {
  const t = getIntlayer("landing", locale);
  const router = useRouter();
  const pathname = usePathname();

  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as LocalesValues;
    // Substitui apenas o segmento do locale no pathname actual
    // ex: /pt/terms -> /en/terms
    const newPath = pathname.replace(/^\/[a-z]{2}/, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <footer className="border-t border-theme px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <SpoolIQLogo size={28} />

        <p className="text-sm text-dark-subtle">
          © {new Date().getFullYear()} SpoolIQ. {t.footer_tagline}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Links */}
          <div className="flex gap-4 text-sm text-dark-subtle">
            <Link
              href={`/${locale}/privacy`}
              className="hover:text-navy-300 transition-colors"
            >
              {t.footer_privacy}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="hover:text-navy-300 transition-colors"
            >
              {t.footer_terms}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="hover:text-navy-300 transition-colors"
            >
              {t.footer_contact}
            </Link>
          </div>

          {/* Locale select */}
          <div className="relative">
            <select
              value={locale}
              onChange={handleLocaleChange}
              className="appearance-none pl-8 pr-8 py-1.5 rounded-lg text-sm font-medium
                         bg-dark-surface border border-theme/40 text-navy-300
                         hover:border-theme/70 focus:outline-none focus:border-brand-500/60
                         cursor-pointer transition-colors"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-base pointer-events-none">
              {current.flag}
            </span>
            <svg
              className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-subtle pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
