import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("products", locale);
  return { title: c.page.title };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("products", locale);
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      include: {
        category: true,
        bom: {
          include: {
            component: {
              include: {
                stock: true,
                profiles: {
                  include: { filaments: true },
                  take: 1,
                },
              },
            },
          },
        },
        extras: { include: { extra: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  const enriched = products.map((p) => {
    const componentCount = p.bom.length;

    const estimatedMinutes = p.bom.reduce((acc, entry) => {
      const t = entry.component.profiles[0]?.printTime ?? 0;
      return acc + t * entry.quantity;
    }, 0);

    const totalFilamentG = p.bom.reduce((acc, entry) => {
      const g = entry.component.profiles[0]?.filamentUsed ?? 0;
      return acc + g * entry.quantity;
    }, 0);

    const stockReady =
      componentCount > 0 &&
      p.bom.every(
        (entry) => (entry.component.stock?.quantity ?? 0) >= entry.quantity,
      );

    const materials = [
      ...new Set(
        p.bom.flatMap(
          (entry) =>
            entry.component.profiles[0]?.filaments.map((f) => f.material) ?? [],
        ),
      ),
    ];

    return {
      ...p,
      componentCount,
      estimatedMinutes,
      totalFilamentG,
      stockReady,
      materials,
    };
  });

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
      <ProductsClient
        initialProducts={enriched as any}
        categories={categories}
        locale={locale}
      />
    </div>
  );
}
