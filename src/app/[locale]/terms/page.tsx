import { useIntlayer } from "next-intlayer/server";
import type { Metadata } from "next";
import type { LocalesValues } from "intlayer";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useIntlayer("terms", locale);
  return {
    title: content.meta.title.value,
    description: content.meta.description.value,
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useIntlayer("terms", locale);

  return (
    <div className="lp-theme bg-background text-foreground min-h-screen flex flex-col">
      <LandingHeader locale={locale} />

      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
          <div className="space-y-3">
            <h1
              className="font-display font-bold text-theme text-3xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              {content.hero.title}
            </h1>
            <p className="text-sm text-dark-subtle">
              {content.hero.lastUpdated}: {content.hero.date}
            </p>
            <p className="text-base text-navy-400 leading-relaxed">
              {content.hero.intro}
            </p>
          </div>

          <hr className="border-theme/40" />

          <Section title={content.sections.service.title}>
            <p>{content.sections.service.body}</p>
          </Section>

          <Section title={content.sections.account.title}>
            <ul className="space-y-2 list-disc list-inside">
              <li>{content.sections.account.items.eligibility}</li>
              <li>{content.sections.account.items.accuracy}</li>
              <li>{content.sections.account.items.security}</li>
              <li>{content.sections.account.items.oneAccount}</li>
            </ul>
          </Section>

          <Section title={content.sections.acceptableUse.title}>
            <p>{content.sections.acceptableUse.intro}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>{content.sections.acceptableUse.items.illegal}</li>
              <li>{content.sections.acceptableUse.items.harm}</li>
              <li>{content.sections.acceptableUse.items.scraping}</li>
              <li>{content.sections.acceptableUse.items.interference}</li>
            </ul>
          </Section>

          <Section title={content.sections.payments.title}>
            <p>{content.sections.payments.body}</p>
          </Section>

          <Section title={content.sections.data.title}>
            <p>{content.sections.data.body}</p>
          </Section>

          <Section title={content.sections.intellectualProperty.title}>
            <p>{content.sections.intellectualProperty.body}</p>
          </Section>

          <Section title={content.sections.liability.title}>
            <p>{content.sections.liability.body}</p>
          </Section>

          <Section title={content.sections.termination.title}>
            <p>{content.sections.termination.body}</p>
          </Section>

          <Section title={content.sections.governing.title}>
            <p>{content.sections.governing.body}</p>
          </Section>

          <Section title={content.sections.changes.title}>
            <p>{content.sections.changes.body}</p>
          </Section>

          <Section title={content.sections.contact.title}>
            <p>{content.sections.contact.body}</p>
          </Section>
        </div>
      </main>

      <LandingFooter locale={locale} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2
        className="font-display font-semibold text-theme text-xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <div className="text-base text-navy-400 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
