import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SalesClient } from "./SalesClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("sales", locale);
  return { title: c.page.title };
}

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("sales", locale);
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const [sales, products, productionTotals, salesTotals] = await Promise.all([
    // Vendas com produto e cliente
    prisma.sale.findMany({
      where: { userId },
      include: {
        product: true,
        customer: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    }),

    // Produtos para o dialog de nova venda
    prisma.product.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),

    // Total produzido por produto (OPs concluídas)
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { userId, status: "done" } },
      _sum: { completed: true },
    }),

    // Total vendido por produto
    prisma.sale.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
  ]);

  // Calcular preço médio por material para estimar custo por unidade
  const spools = await prisma.inventoryPurchase.findMany({
    where: { userId, archivedAt: null },
    include: { item: true },
  });

  const materialPriceMap: Record<string, number> = {};
  const groups: Record<string, { cost: number; weight: number }> = {};
  for (const s of spools) {
    const m = s.item.material;
    if (!groups[m]) groups[m] = { cost: 0, weight: 0 };
    groups[m].cost += s.priceCents / 100;
    groups[m].weight += s.initialWeight;
  }
  for (const [m, { cost, weight }] of Object.entries(groups)) {
    materialPriceMap[m] = weight > 0 ? cost / weight : 0.025;
  }

  // Calcular custo por unidade por produto (via BOM)
  const productsWithBom = await prisma.product.findMany({
    where: { userId },
    include: {
      bom: {
        include: {
          component: {
            include: {
              profiles: { include: { filaments: true }, take: 1 },
            },
          },
        },
      },
      extras: { include: { extra: true } },
    },
  });

  const costMap: Record<string, number> = {};
  for (const p of productsWithBom) {
    const bomCost = p.bom.reduce((acc, entry) => {
      const profile = entry.component.profiles[0];
      if (!profile) return acc;
      const filamentCost = profile.filaments.reduce((a, f) => {
        const pricePerG = materialPriceMap[f.material] ?? 0.025;
        return a + f.estimatedG * pricePerG;
      }, 0);
      const batchSize = (profile as any).batchSize ?? 1;
      return acc + entry.quantity * (filamentCost / batchSize);
    }, 0);
    const extrasCost = p.extras.reduce(
      (acc, e) => acc + e.extra.price * e.quantity,
      0,
    );
    costMap[p.id] = bomCost + extrasCost;
  }

  // Calcular stock por produto
  const productionMap = Object.fromEntries(
    productionTotals.map((r) => [r.productId, r._sum.completed ?? 0]),
  );
  const salesMap = Object.fromEntries(
    salesTotals.map((r) => [r.productId, r._sum.quantity ?? 0]),
  );

  const productsWithStock = products.map((p) => ({
    ...p,
    stock: (productionMap[p.id] ?? 0) - (salesMap[p.id] ?? 0),
    costPerUnit: costMap[p.id] ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // Enriquecer vendas com costPerUnit
  const enrichedSales = sales.map((s) => ({
    ...s,
    date: s.date.toISOString(),
    costPerUnit: costMap[s.productId] ?? null,
    customer: s.customer ?? null,
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
      <SalesClient
        initialSales={enrichedSales as any}
        products={productsWithStock as any}
      />
    </div>
  );
}
