import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerDetailClient } from "./CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

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

  // Custo médio por unidade por produto (para calcular lucro)
  const productIds = [...new Set(customer.sales.map((s) => s.productId))];
  const productionCosts = await prisma.productionLog.groupBy({
    by: ["productId"],
    where: { userId, productId: { in: productIds } },
    _avg: { totalCost: true },
  });

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const costMap = Object.fromEntries(
    productionCosts.map((p) => [
      p.productId,
      (p._avg.totalCost ?? 0) /
        (products.find((pr) => pr.id === p.productId)?.unitsPerPrint ?? 1),
    ]),
  );

  // Estatísticas
  const totalSpent = customer.sales.reduce(
    (s, x) => s + x.salePrice * x.quantity,
    0,
  );
  const totalUnits = customer.sales.reduce((s, x) => s + x.quantity, 0);
  const totalProfit = customer.sales.reduce((s, x) => {
    const cost = costMap[x.productId] ?? 0;
    return s + (x.salePrice - cost) * x.quantity;
  }, 0);

  // Produto favorito (mais comprado)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {customer.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cliente desde{" "}
            {new Date(customer.createdAt).toLocaleDateString("pt-PT", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <CustomerDetailClient
        customer={customer as any}
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
