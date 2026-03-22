import Link from "next/link";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { SpoolIQLogo } from "@/components/ui/logo";
import {
  Check,
  Zap,
  BarChart3,
  Package,
  Printer,
  QrCode,
  ShoppingCart,
  ArrowRight,
  Star,
  Shield,
  Clock,
} from "lucide-react";
import { LandingFooter } from "@/components/layout/LandingFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const t = getIntlayer("landing", locale);
  return { title: `SpoolIQ — ${t.tagline}` };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;

  const t = getIntlayer("landing", locale);
  const tf = getIntlayer("features", locale);
  const tp = getIntlayer("pricing", locale);
  const tfaq = getIntlayer("faq", locale);

  const hobbyFeatures = [
    tp.hobby_f1,
    tp.hobby_f2,
    tp.hobby_f3,
    tp.hobby_f4,
    tp.hobby_f5,
    tp.hobby_f6,
    tp.hobby_f7,
  ] as const;

  const proFeatures = [
    tp.pro_f1,
    tp.pro_f2,
    tp.pro_f3,
    tp.pro_f4,
    tp.pro_f5,
    tp.pro_f6,
    tp.pro_f7,
    tp.pro_f8,
    tp.pro_f9,
  ] as const;

  const faqs = [
    { q: tfaq.q1, a: tfaq.a1 },
    { q: tfaq.q2, a: tfaq.a2 },
    { q: tfaq.q3, a: tfaq.a3 },
    { q: tfaq.q4, a: tfaq.a4 },
  ];

  const features = [
    {
      icon: Package,
      title: tf.inventory_title,
      desc: tf.inventory_desc,
      tag: tf.inventory_tag,
    },
    {
      icon: Printer,
      title: tf.printers_title,
      desc: tf.printers_desc,
      tag: tf.printers_tag,
    },
    {
      icon: BarChart3,
      title: tf.costs_title,
      desc: tf.costs_desc,
      tag: tf.costs_tag,
    },
    {
      icon: QrCode,
      title: tf.qr_title,
      desc: tf.qr_desc,
      tag: tf.qr_tag,
    },
    {
      icon: ShoppingCart,
      title: tf.orders_title,
      desc: tf.orders_desc,
      tag: tf.orders_tag,
    },
    {
      icon: Clock,
      title: tf.maintenance_title,
      desc: tf.maintenance_desc,
      tag: tf.maintenance_tag,
    },
  ];

  return (
    <div className="lp-theme bg-background text-foreground min-h-screen">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-theme/60 bg-dark-bg/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <SpoolIQLogo />
          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="btn-ghost text-sm">
              {t.features_badge}
            </a>
            <a href="#pricing" className="btn-ghost text-sm">
              {tp.hobby_name} / Pro
            </a>
            <a href="#faq" className="btn-ghost text-sm">
              FAQ
            </a>
          </nav>
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

      <main>
        {/* Hero */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(14,165,233,0.18) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: "linear-gradient(to top, #060c18, transparent)",
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="badge-brand mb-6">
              <Zap className="w-3 h-3" />
              {t.badge}
            </div>
            <h1
              className="font-display font-bold leading-[1.05] mb-6"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                letterSpacing: "-0.04em",
              }}
            >
              <span className="text-theme">{t.headline1}</span>
              <br />
              <span className="text-gradient">{t.headline2}</span>
            </h1>
            <p className="text-navy-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-4">
              {t.subheadline}
            </p>
            <p
              className="font-display font-medium text-brand-400 text-base mb-10"
              style={{ letterSpacing: "-0.01em" }}
            >
              {t.tagline}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-16">
              <Link
                href={`/${locale}/sign-up`}
                className="btn-primary px-7 py-3 text-base gap-2"
              >
                {t.cta_start}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/login`}
                className="btn-secondary px-7 py-3 text-base"
              >
                {t.cta_login}
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-dark-subtle">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-dark-bg bg-gradient-to-br from-brand-500 to-brand-800"
                    />
                  ))}
                </div>
                <span>{t.social_makers}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-warning text-warning"
                  />
                ))}
                <span className="ml-1">{t.social_rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-success" />
                <span>{t.social_no_card}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="badge-brand inline-flex mb-4">
                {t.features_badge}
              </div>
              <h2
                className="font-display font-bold text-theme mb-4"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                {t.features_title1}
                <br />
                <span className="text-gradient">{t.features_title2}</span>
              </h2>
              <p className="text-navy-400 text-lg max-w-xl mx-auto">
                {t.features_subtitle}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={String(feat.title)}
                    className="card group hover:border-brand-500/30 hover:bg-brand-500/[0.04] transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-brand-400" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-dark-subtle uppercase tracking-widest mb-1">
                          {feat.tag}
                        </div>
                        <h3
                          className="font-display font-semibold text-theme mb-1.5"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          {feat.title}
                        </h3>
                        <p className="text-sm text-navy-400 leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-28 px-6 relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="badge-brand inline-flex mb-4">
                {t.pricing_badge}
              </div>
              <h2
                className="font-display font-bold text-theme mb-4"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                {t.pricing_title1}
                <span className="text-gradient">{t.pricing_title2}</span>
              </h2>
              <p className="text-navy-400 text-lg">{t.pricing_subtitle}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-stretch">
              {/* Hobby */}
              <div className="card flex flex-col">
                <div className="mb-6">
                  <div className="text-xs font-semibold uppercase tracking-widest text-dark-subtle mb-2">
                    {tp.hobby_name}
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <span
                      className="font-display font-bold text-theme"
                      style={{
                        fontSize: "3rem",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                      }}
                    >
                      €0
                    </span>
                    <span className="text-dark-subtle text-sm mb-1">
                      {tp.per_month}
                    </span>
                  </div>
                  <p className="text-sm text-navy-400">{tp.hobby_desc}</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {hobbyFeatures.map((label, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-navy-300"
                    >
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/sign-up`}
                  className="btn-secondary w-full justify-center py-3"
                >
                  {tp.hobby_cta}
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-xl overflow-hidden">
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #075985 100%)",
                    padding: "1px",
                  }}
                >
                  <div className="h-full w-full rounded-xl bg-theme-surface" />
                </div>
                <div className="relative z-10 p-5 flex flex-col h-full">
                  <div className="absolute top-4 right-4">
                    <span className="badge-brand text-xs">
                      <Star className="w-3 h-3 fill-brand-400" />
                      {tp.pro_badge}
                    </span>
                  </div>
                  <div className="mb-6">
                    <div className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">
                      {tp.pro_name}
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                      <span
                        className="font-display font-bold text-gradient"
                        style={{
                          fontSize: "3rem",
                          letterSpacing: "-0.04em",
                          lineHeight: 1,
                        }}
                      >
                        €5
                      </span>
                      <span className="text-dark-subtle text-sm mb-1">
                        {tp.per_month}
                      </span>
                    </div>
                    <p className="text-sm text-navy-400">{tp.pro_desc}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {proFeatures.map((label, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-navy-200"
                      >
                        <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                        {label}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${locale}/sign-up?plan=pro`}
                    className="btn-primary w-full justify-center py-3 text-base"
                  >
                    {tp.pro_cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-dark-subtle mt-8">
              {tp.stripe_note}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-28 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="font-display font-bold text-theme mb-3"
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                {t.faq_title}
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="card">
                  <div
                    className="font-display font-semibold text-theme mb-2"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {faq.q}
                  </div>
                  <p className="text-sm text-navy-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-28 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="card-glow rounded-2xl p-12 relative overflow-hidden"
              style={{
                border: "1px solid rgba(14,165,233,0.2)",
                background:
                  "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(14,165,233,0.12) 0%, #0a1020 60%)",
              }}
            >
              <SpoolIQLogo className="justify-center mb-6" />
              <h2
                className="font-display font-bold text-theme mb-4"
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                {t.cta_final_title}
              </h2>
              <p className="text-navy-400 text-lg mb-8 max-w-md mx-auto">
                {t.cta_final_sub}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/${locale}/register`}
                  className="btn-primary px-8 py-3 text-base"
                >
                  {t.cta_start}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="btn-secondary px-8 py-3 text-base"
                >
                  {t.cta_login}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter locale={locale} />
    </div>
  );
}
