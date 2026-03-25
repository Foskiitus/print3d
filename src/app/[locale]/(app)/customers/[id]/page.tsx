import { requirePageAuth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerDetailClient } from "./CustomerDetailClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues; id: string }>;
}) {
  const { locale, id } = await params;
  const c = getIntlayer("customers", locale);

  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        include: { product: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!customer || customer.userId !== userId) notFound();

  // Calcular preço médio por material para estimar custo
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

  // Custo por unidade via BOM
  const productIds = [...new Set(customer.sales.map((s) => s.productId))];
  const productsWithBom = await prisma.product.findMany({
    where: { id: { in: productIds }, userId },
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
        return a + f.estimatedG * (materialPriceMap[f.material] ?? 0.025);
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

  const totalSpent = customer.sales.reduce(
    (s, x) => s + x.salePrice * x.quantity,
    0,
  );
  const totalUnits = customer.sales.reduce((s, x) => s + x.quantity, 0);
  const totalProfit = customer.sales.reduce((s, x) => {
    const cost = costMap[x.productId] ?? 0;
    return s + (x.salePrice - cost) * x.quantity;
  }, 0);

  const productTotals = customer.sales.reduce(
    (
      acc: Record<string, { name: string; quantity: number; revenue: number }>,
      s,
    ) => {
      if (!acc[s.productId]) {
        acc[s.productId] = { name: s.product.name, quantity: 0, revenue: 0 };
      }
      acc[s.productId].quantity += s.quantity;
      acc[s.productId].revenue += s.salePrice * s.quantity;
      return acc;
    },
    {},
  );

  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const customerSinceDate = new Date(customer.createdAt).toLocaleDateString(
    locale === "en" ? "en-GB" : "pt-PT",
    { month: "long", year: "numeric" },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/customers`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {customer.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {c.detail.customerSince} {customerSinceDate}
          </p>
        </div>
      </div>

      <CustomerDetailClient
        customer={customer as any}
        locale={locale}
        sales={customer.sales.map((s) => ({
          ...s,
          date: s.date.toISOString(),
          costPerUnit: costMap[s.productId] ?? null,
          product: {
            ...s.product,
            createdAt: s.product.createdAt.toISOString(),
            updatedAt: s.product.updatedAt.toISOString(),
          },
        }))}
        stats={{ totalSpent, totalUnits, totalProfit }}
        topProducts={topProducts}
      />
    </div>
  );
}
