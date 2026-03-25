import { requirePageAuth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import type { LocalesValues } from "intlayer";

const FALLBACK_PRICE_PER_G = 0.025;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: LocalesValues }>;
}) {
  const { id, locale } = await params;
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const [product, allComponents, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, userId },
      include: {
        category: true,
        bom: {
          include: {
            component: {
              include: {
                stock: true,
                profiles: { include: { filaments: true } },
              },
            },
          },
          orderBy: { component: { name: "asc" } },
        },
        extras: { include: { extra: true } },
        sales: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    }),

    prisma.component.findMany({
      where: { userId },
      include: {
        stock: true,
        profiles: { include: { filaments: true } },
      },
      orderBy: { name: "asc" },
    }),

    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  // Preço médio por material a partir dos rolos
  const spools = await prisma.inventoryPurchase.findMany({
    where: { userId, archivedAt: null },
    include: { item: true },
    orderBy: { boughtAt: "asc" },
  });

  const pricePerGByMaterial = new Map<string, number>();
  for (const spool of spools) {
    const material = spool.item.material;
    if (!pricePerGByMaterial.has(material)) {
      pricePerGByMaterial.set(
        material,
        spool.priceCents / 100 / spool.initialWeight,
      );
    }
  }

  const bomCost = product.bom.reduce((acc, entry) => {
    const componentCostPerUnit = entry.component.profiles.reduce(
      (profileAcc, profile) => {
        const g = profile.filamentUsed ?? 0;
        const batch = (profile as any).batchSize ?? 1;
        const primaryMaterial = profile.filaments[0]?.material;
        const pricePerG = primaryMaterial
          ? (pricePerGByMaterial.get(primaryMaterial) ?? FALLBACK_PRICE_PER_G)
          : FALLBACK_PRICE_PER_G;
        return profileAcc + (g * pricePerG) / batch;
      },
      0,
    );
    const profileCount = entry.component.profiles.length || 1;
    return acc + entry.quantity * (componentCostPerUnit / profileCount);
  }, 0);

  const extrasCost = product.extras.reduce(
    (sum, e) => sum + e.extra.price * e.quantity,
    0,
  );

  const estimatedCost = bomCost + extrasCost;
  const suggestedPrice = estimatedCost * (1 + product.margin);

  const estimatedMinutes = product.bom.reduce((acc, entry) => {
    const t = entry.component.profiles.reduce(
      (s, p) => s + (p.printTime ?? 0),
      0,
    );
    return acc + t * entry.quantity;
  }, 0);

  return (
    <ProductDetailClient
      product={product as any}
      allComponents={allComponents as any}
      categories={categories}
      estimatedCost={estimatedCost}
      suggestedPrice={suggestedPrice}
      estimatedMinutes={estimatedMinutes}
      backHref={`/${locale}/catalog`}
    />
  );
}
