import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";

export const metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      include: {
        category: true,
        printer: true,
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
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Catálogo de produtos — define materiais, tempos e custos de produção.
        </p>
      </div>
      <ProductsClient
        initialProducts={products as any}
        categories={categories as any}
      />
    </div>
  );
}
