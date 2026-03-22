import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StockClient } from "./StockClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("stock", locale);
  return { title: c.page.title };
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("stock", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

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

  const totalProducts = stockItems.length;
  const inStock = stockItems.filter((p) => p.stock > 0).length;
  const outOfStock = stockItems.filter((p) => p.stock <= 0).length;
  const lowStock = stockItems.filter((p) => p.stock > 0 && p.stock <= 3).length;

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
      <StockClient
        items={stockItems as any}
        summary={{ totalProducts, inStock, outOfStock, lowStock }}
      />
    </div>
  );
}
