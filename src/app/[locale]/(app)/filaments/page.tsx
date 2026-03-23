import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { InventoryClient } from "./InventoryClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("filaments", locale);
  return { title: c.page.title.value };
}

export default async function FilamentsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const userId = await requirePageAuth();

  const [purchases, suppliers] = await Promise.all([
    prisma.inventoryPurchase.findMany({
      where: { userId },
      include: { item: true, supplier: true },
      orderBy: { boughtAt: "desc" },
    }),
    prisma.supplier.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <InventoryClient
      initialPurchases={purchases as any}
      suppliers={suppliers as any}
      locale={locale}
    />
  );
}
