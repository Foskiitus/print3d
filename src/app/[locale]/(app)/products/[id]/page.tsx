import { getAuthUserId } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductDetailClient } from "./ProductDetailClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: LocalesValues }>;
}) {
  const { id, locale } = await params;

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [product, spools] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        printer: true,
        filamentUsage: { include: { filamentType: true } },
        extras: { include: { extra: true } },
        printProfiles: { orderBy: { createdAt: "desc" } },
        productionLogs: {
          include: { printer: true },
          orderBy: { date: "desc" },
        },
        _count: { select: { productionLogs: true, sales: true } },
      },
    }),
    prisma.filamentSpool.findMany({
      where: { userId, remaining: { gt: 0 } },
      orderBy: { purchaseDate: "asc" },
      include: { filamentType: true },
    }),
  ]);

  if (!product || product.userId !== userId) notFound();

  // 1. Filament cost (FIFO)
  let filamentCost = 0;
  for (const usage of product.filamentUsage) {
    const spool = spools.find((s) => s.filamentTypeId === usage.filamentTypeId);
    if (spool) {
      filamentCost += (spool.price / spool.spoolWeight) * usage.weight;
    }
  }

  // 2. Extras cost
  const extrasCost = product.extras.reduce(
    (sum, e) => sum + e.extra.price * e.quantity,
    0,
  );

  // 3. Printer + energy cost
  let printerCost: number | null = null;
  let electricityCost: number | null = null;

  if (product.printer && product.productionTime) {
    const printHours = product.productionTime / 60;
    printerCost = printHours * product.printer.hourlyCost;

    const electricitySetting = await prisma.settings.findUnique({
      where: { userId_key: { userId, key: "electricityPrice" } },
    });
    const electricityPrice = electricitySetting
      ? Number(electricitySetting.value)
      : 0.2;

    electricityCost =
      (product.printer.powerWatts / 1000) * printHours * electricityPrice;
  }

  const totalCost =
    filamentCost + extrasCost + (printerCost ?? 0) + (electricityCost ?? 0);

  const suggestedPrice = totalCost * (1 + product.margin);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/products`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {product.name}
          </h1>
          {product.category && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {product.category.name}
            </p>
          )}
        </div>
      </div>

      <ProductDetailClient
        product={product as any}
        costs={{
          filamentCost,
          extrasCost,
          printerCost,
          electricityCost,
          totalCost,
          suggestedPrice,
        }}
      />
    </div>
  );
}
