import Link from "next/link";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { SpoolIQLogo } from "@/components/ui/logo";

export function LandingHeader({ locale }: { locale: LocalesValues }) {
  const t = getIntlayer("landing", locale);
  const tp = getIntlayer("pricing", locale);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-theme/60 bg-dark-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/">
          <SpoolIQLogo />
        </a>

        <div className="flex items-center gap-3">
          <Link href={`/${locale}/sign-in`} className="btn-ghost text-sm">
            {t.cta_login}
          </Link>
          <Link href={`/${locale}/sign-up`} className="btn-primary text-sm">
            {t.cta_start}
          </Link>
        </div>
      </div>
    </header>
  );
}
