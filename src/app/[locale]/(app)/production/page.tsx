import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductionClient } from "./ProductionClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("production", locale);
  return { title: c.page.title };
}

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("production", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [logs, products, printers] = await Promise.all([
    prisma.productionLog.findMany({
      where: { userId },
      include: { product: true, printer: true },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.product.findMany({
      where: { userId },
      include: { filamentUsage: { include: { filamentType: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.printer.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedLogs = logs.map((l) => ({
    ...l,
    date: l.date.toISOString(),
    product: {
      ...l.product,
      createdAt: l.product.createdAt.toISOString(),
      updatedAt: l.product.updatedAt.toISOString(),
    },
  }));

  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

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
      <ProductionClient
        initialLogs={serializedLogs as any}
        products={serializedProducts as any}
        printers={printers as any}
      />
    </div>
  );
}
