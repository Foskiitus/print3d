import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { ProductionPageClient } from "./ProductionPageClient";

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
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const [orders, products, printers, inventory] = await Promise.all([
    // Ordens de produção com itens e print jobs
    prisma.productionOrder.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                bom: {
                  include: {
                    component: {
                      include: {
                        profiles: {
                          include: { filaments: true },
                          take: 1,
                        },
                        stock: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        printJobs: {
          include: {
            printer: { include: { preset: true } },
            items: {
              include: {
                component: true,
                profile: { include: { filaments: true } },
              },
            },
            materials: { include: { spool: { include: { item: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Produtos do utilizador para o dialog de nova OP
    prisma.product.findMany({
      where: { userId },
      include: {
        bom: {
          include: {
            component: {
              include: {
                profiles: { include: { filaments: true }, take: 1 },
                stock: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),

    // Impressoras com unidades e slots
    prisma.printer.findMany({
      where: { userId },
      include: {
        preset: true,
        units: {
          include: {
            unitPreset: true,
            slots: {
              include: {
                currentSpool: { include: { item: true } },
              },
              orderBy: { position: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    // Inventário de bobines para cálculo de custos
    prisma.inventoryPurchase.findMany({
      where: { userId, archivedAt: null },
      include: { item: true },
    }),
  ]);

  // Calcular preço médio por grama por material
  const materialPriceMap: Record<string, number> = {};
  const groups: Record<string, { cost: number; weight: number }> = {};
  for (const p of inventory) {
    const m = p.item.material;
    if (!groups[m]) groups[m] = { cost: 0, weight: 0 };
    groups[m].cost += p.priceCents / 100;
    groups[m].weight += p.initialWeight;
  }
  for (const [m, { cost, weight }] of Object.entries(groups)) {
    materialPriceMap[m] = weight > 0 ? cost / weight : 0.025;
  }

  return (
    <ProductionPageClient
      initialOrders={orders as any}
      products={products as any}
      printers={printers as any}
      materialPriceMap={materialPriceMap}
      locale={locale}
    />
  );
}
