import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
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

export default async function SalesLedgerPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("sales", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  // --- DADOS DUMMY (Substituindo o Prisma) ---

  const products = [
    {
      id: "p1",
      name: "Articulated Dragon",
      unitsPerPrint: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "p2",
      name: "Low-Poly Vase",
      unitsPerPrint: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const sales = [
    {
      id: "s1",
      date: new Date(),
      quantity: 2,
      totalPrice: 30,
      productId: "p1",
      product: products[0],
      customer: { id: "c1", name: "João Silva" },
    },
  ];

  const productionTotals = [
    { productId: "p1", _sum: { quantity: 10 } },
    { productId: "p2", _sum: { quantity: 5 } },
  ];

  const salesTotals = [
    { productId: "p1", _sum: { quantity: 2 } },
    { productId: "p2", _sum: { quantity: 0 } },
  ];

  const productionCosts = [
    { productId: "p1", _avg: { totalCost: 5.5 } },
    { productId: "p2", _avg: { totalCost: 2.1 } },
  ];

  // --- LÓGICA DE CÁLCULO (Mantida igual, mas usando os arrays acima) ---

  const stockMap = Object.fromEntries(
    products.map((p) => {
      const produced =
        productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      return [p.id, produced - sold];
    }),
  );

  const costMap = Object.fromEntries(
    productionCosts.map((p) => [
      p.productId,
      (p._avg.totalCost ?? 0) /
        (products.find((pr) => pr.id === p.productId)?.unitsPerPrint ?? 1),
    ]),
  );

  const productsWithStock = products.map((p) => ({
    ...p,
    stock: stockMap[p.id] ?? 0,
    costPerUnit: costMap[p.id] ?? null,
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
      <SalesClient
        initialSales={
          sales.map((s) => ({
            ...s,
            date: s.date.toISOString(),
            product: {
              ...s.product,
              createdAt: s.product.createdAt.toISOString(),
              updatedAt: s.product.updatedAt.toISOString(),
            },
            customer: s.customer ? { ...s.customer } : null,
          })) as any
        }
        products={productsWithStock as any}
      />
    </div>
  );
}
