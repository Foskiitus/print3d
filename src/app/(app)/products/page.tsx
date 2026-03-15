import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";

export const metadata = {
  title: "Produtos | Print3D",
};

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // 3 queries eficientes em paralelo
  const [products, categories, productionTotals, salesTotals] =
    await Promise.all([
      prisma.product.findMany({
        where: { userId },
        include: {
          category: true,
          filamentUsage: { include: { filamentType: true } },
          extras: { include: { extra: true } },
          _count: { select: { productionLogs: true, sales: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      // ✅ Soma total de unidades produzidas por produto
      prisma.productionLog.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
      // ✅ Soma total de unidades vendidas por produto
      prisma.sale.groupBy({
        by: ["productId"],
        where: { userId },
        _sum: { quantity: true },
      }),
    ]);

  // Calcular stock no servidor antes de passar ao cliente
  const productsWithStock = products.map((p) => {
    const produced =
      productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
    const sold =
      salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
    return { ...p, stock: produced - sold };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gira o catálogo de produtos e os seus custos de produção.
        </p>
      </div>
      <ProductsClient
        initialProducts={productsWithStock as any}
        categories={categories as any}
      />
    </div>
  );
}
