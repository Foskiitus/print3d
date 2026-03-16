import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SalesClient } from "./SalesClient";

export default async function SalesLedgerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [sales, products, productionTotals, salesTotals, productionCosts] =
    await Promise.all([
      prisma.sale.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { date: "desc" },
      }),
      prisma.product.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      // Stock: total produzido por produto
      prisma.productionLog.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
      // Stock: total vendido por produto
      prisma.sale.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
      // Custo médio de produção por produto
      prisma.productionLog.groupBy({
        by: ["productId"],
        where: { userId },
        _avg: { totalCost: true },
      }),
    ]);

  // Calcular stock disponível por produto
  const stockMap = Object.fromEntries(
    products.map((p) => {
      const produced =
        productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      return [p.id, produced - sold];
    }),
  );

  // Custo médio por unidade
  const costMap = Object.fromEntries(
    productionCosts.map((p) => [
      p.productId,
      (p._avg.totalCost ?? 0) /
        (products.find((pr) => pr.id === p.productId)?.unitsPerPrint ?? 1),
    ]),
  );

  // Adicionar stock a cada produto
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
        <h1 className="text-xl font-semibold text-foreground">Vendas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registe vendas e consulte o histórico de transações
        </p>
      </div>

      <SalesClient
        initialSales={sales.map((s) => ({
          ...s,
          date: s.date.toISOString(),
          product: {
            ...s.product,
            createdAt: s.product.createdAt.toISOString(),
            updatedAt: s.product.updatedAt.toISOString(),
          },
          costPerUnit: costMap[s.productId] ?? null,
        }))}
        products={productsWithStock as any}
      />
    </div>
  );
}
