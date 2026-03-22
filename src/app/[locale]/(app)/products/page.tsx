import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("products", locale);
  return { title: c.page.title };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("products", locale);

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
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {c.page.description}
        </p>
      </div>
      <ProductsClient
        initialProducts={products as any}
        categories={categories as any}
      />
    </div>
  );
}
