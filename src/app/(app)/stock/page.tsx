import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StockClient } from "./StockClient";

export const metadata = {
  title: "Stock",
};

export default async function StockPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [products, productionTotals, salesTotals] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      include: {
        category: true,
        printer: true,
        filamentUsage: { include: { filamentType: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.productionLog.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
    prisma.sale.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
  ]);

  const stockItems = products.map((p) => {
    const produced =
      productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
    const sold =
      salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
    const stock = produced - sold;
    return { ...p, produced, sold, stock };
  });

  // Métricas de resumo
  const totalProducts = stockItems.length;
  const inStock = stockItems.filter((p) => p.stock > 0).length;
  const outOfStock = stockItems.filter((p) => p.stock <= 0).length;
  const lowStock = stockItems.filter((p) => p.stock > 0 && p.stock <= 3).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Stock</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Unidades disponíveis por produto — calculado a partir da produção e
          vendas.
        </p>
      </div>
      <StockClient
        items={stockItems as any}
        summary={{ totalProducts, inStock, outOfStock, lowStock }}
      />
    </div>
  );
}
