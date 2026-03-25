import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { LocalesValues } from "intlayer";
import { getIntlayer } from "intlayer";
import { ComponentsClient } from "./ComponentsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("components", locale);
  return { title: c.page.title.value };
}

export default async function ComponentsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const [components, purchases, settings] = await Promise.all([
    prisma.component.findMany({
      where: { userId },
      include: {
        profiles: {
          include: { filaments: true },
          orderBy: { createdAt: "desc" },
        },
        stock: true,
        bom: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),

    // Bobines para calcular preço médio por material
    prisma.inventoryPurchase.findMany({
      where: { userId, archivedAt: null },
      include: { item: true },
    }),

    // Settings do utilizador (kWh price)
    prisma.settings.findMany({
      where: { userId },
    }),
  ]);

  // Calcular preço médio por grama por material
  // ex: { PLA: 0.025, PETG: 0.03 }
  const materialPriceMap: Record<string, number> = {};
  const materialGroups: Record<
    string,
    { totalCost: number; totalWeight: number }
  > = {};

  for (const p of purchases) {
    const material = p.item.material;
    if (!materialGroups[material]) {
      materialGroups[material] = { totalCost: 0, totalWeight: 0 };
    }
    materialGroups[material].totalCost += p.priceCents / 100;
    materialGroups[material].totalWeight += p.initialWeight;
  }

  for (const [material, { totalCost, totalWeight }] of Object.entries(
    materialGroups,
  )) {
    materialPriceMap[material] =
      totalWeight > 0 ? totalCost / totalWeight : 0.025;
  }

  // kWh price das settings
  const kwhSetting = settings.find((s) => s.key === "electricityPrice");
  const kwhPrice = kwhSetting ? Number(kwhSetting.value) : 0.16;

  return (
    <ComponentsClient
      components={components as any}
      materialPriceMap={materialPriceMap}
      kwhPrice={kwhPrice}
      locale={locale}
    />
  );
}
