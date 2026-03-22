"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import type { LocalesValues } from "intlayer";

const LOCALES: { value: LocalesValues; label: string }[] = [
  { value: "pt", label: "PT" },
  { value: "en", label: "EN" },
];

export function LocaleSwitcher() {
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    // Substitui o prefixo de locale no pathname atual
    // ex: /pt/dashboard → /en/dashboard
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => switchLocale(value)}
          className={
            locale === value
              ? "text-xs font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10"
              : "text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
