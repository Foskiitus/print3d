import { requirePageAuth, getAuthUserIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintersClient } from "./PrintersClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("printers", locale);
  return { title: c.page.title };
}

export default async function PrintersPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("printers", locale);

  const userId = await requirePageAuth();
  const isAdmin = await getAuthUserIsAdmin();

  const [printers, presets] = await Promise.all([
    prisma.printer.findMany({
      where: { userId },
      include: { preset: true },
      orderBy: { name: "asc" },
    }),
    prisma.printerPreset.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {c.page.description}
        </p>
      </div>

      <PrintersClient
        initialPrinters={printers as any}
        presets={presets as any}
        isAdmin={isAdmin}
      />

      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-primary mb-1">
          {c.page.costsInfo.heading}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {c.page.costsInfo.bodyPart1}{" "}
          <strong>{c.page.costsInfo.hourlyCost}</strong>{" "}
          {c.page.costsInfo.bodyPart2}{" "}
          <strong>{c.page.costsInfo.consumption}</strong>{" "}
          {c.page.costsInfo.bodyPart3}
        </p>
      </div>
    </div>
  );
}
