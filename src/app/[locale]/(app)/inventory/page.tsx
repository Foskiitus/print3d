import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { InventoryPageClient } from "./InventoryPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("inventory", locale);
  return { title: c.page.title.value };
}

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const userId = await requirePageAuth();

  const [purchases, suppliers, hardwareItems, finishedGoods] =
    await Promise.all([
      // Filamentos (bobines)
      prisma.inventoryPurchase.findMany({
        where: { userId },
        include: {
          item: true,
          supplier: true,
          loadedInSlot: {
            include: {
              unit: {
                include: { printer: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { boughtAt: "desc" },
      }),

      // Fornecedores
      prisma.supplier.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),

      // Hardware & Consumíveis
      prisma.extra.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),

      // Produtos Acabados: produtos com stock calculado
      prisma.product.findMany({
        where: { userId },
        include: {
          category: true,
          // Somar produção
          _count: { select: { sales: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  // Calcular stock de produtos acabados:
  // stock = SUM(productionOrders completed) - SUM(sales)
  const productionTotals = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { userId, status: "done" },
    },
    _sum: { completed: true },
  });

  const salesTotals = await prisma.sale.groupBy({
    by: ["productId"],
    where: { userId },
    _sum: { quantity: true },
  });

  const productionMap = Object.fromEntries(
    productionTotals.map((r) => [r.productId, r._sum.completed ?? 0]),
  );
  const salesMap = Object.fromEntries(
    salesTotals.map((r) => [r.productId, r._sum.quantity ?? 0]),
  );

  const finishedGoodsWithStock = finishedGoods
    .map((p) => ({
      ...p,
      stockQty: (productionMap[p.id] ?? 0) - (salesMap[p.id] ?? 0),
    }))
    .filter((p) => p.stockQty > 0);

  return (
    <InventoryPageClient
      initialPurchases={purchases as any}
      suppliers={suppliers as any}
      hardwareItems={hardwareItems as any}
      finishedGoods={finishedGoodsWithStock as any}
      locale={locale}
    />
  );
}
