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
  const content = useIntlayer("privacy", locale);
  return {
    title: content.meta.title.value,
    description: content.meta.description.value,
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useIntlayer("privacy", locale);

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

          <Section title={content.sections.dataCollected.title}>
            <p>{content.sections.dataCollected.intro}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>{content.sections.dataCollected.items.account}</li>
              <li>{content.sections.dataCollected.items.appData}</li>
              <li>{content.sections.dataCollected.items.payments}</li>
              <li>{content.sections.dataCollected.items.usage}</li>
            </ul>
          </Section>

          <Section title={content.sections.howWeUse.title}>
            <ul className="space-y-2 list-disc list-inside">
              <li>{content.sections.howWeUse.items.service}</li>
              <li>{content.sections.howWeUse.items.communication}</li>
              <li>{content.sections.howWeUse.items.billing}</li>
              <li>{content.sections.howWeUse.items.improvement}</li>
            </ul>
          </Section>

          <Section title={content.sections.dataSharing.title}>
            <p>{content.sections.dataSharing.body}</p>
          </Section>

          <Section title={content.sections.dataRetention.title}>
            <p>{content.sections.dataRetention.body}</p>
          </Section>

          <Section title={content.sections.yourRights.title}>
            <p>{content.sections.yourRights.intro}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>{content.sections.yourRights.items.access}</li>
              <li>{content.sections.yourRights.items.rectification}</li>
              <li>{content.sections.yourRights.items.erasure}</li>
              <li>{content.sections.yourRights.items.portability}</li>
              <li>{content.sections.yourRights.items.objection}</li>
            </ul>
            <p className="mt-3">{content.sections.yourRights.contact}</p>
          </Section>

          <Section title={content.sections.cookies.title}>
            <p>{content.sections.cookies.body}</p>
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
