import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

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
    // Bobines para calcular custo FIFO
    prisma.filamentSpool.findMany({
      where: { userId, remaining: { gt: 0 } },
      orderBy: { purchaseDate: "asc" },
      include: { filamentType: true },
    }),
  ]);

  if (!product || product.userId !== userId) notFound();

  // Calcular custo estimado FIFO
  let filamentCost = 0;
  for (const usage of product.filamentUsage) {
    const spool = spools.find((s) => s.filamentTypeId === usage.filamentTypeId);
    if (spool) {
      filamentCost += (spool.price / spool.spoolWeight) * usage.weight;
    }
  }

  const extrasCost = product.extras.reduce(
    (sum, e) => sum + e.extra.price * e.quantity,
    0,
  );

  const totalCost = filamentCost + extrasCost;
  const suggestedPrice = totalCost * (1 + product.margin);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
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
        costs={{ filamentCost, extrasCost, totalCost, suggestedPrice }}
      />
    </div>
  );
}
