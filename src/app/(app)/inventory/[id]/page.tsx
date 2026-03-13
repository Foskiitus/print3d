import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "./ProductDetailsClient";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  // 1. Vai buscar o Produto e a sua "Receita" atual (CORRIGIDO)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      filamentUsage: { include: { filamentType: true } }, // Mudou de filamentUsages
      extras: { include: { extra: true } }, // Mudou de extrasUsed
    },
  });

  if (!product) return notFound();

  // 2. Vai buscar os ingredientes disponíveis para adicionar à receita
  const [filamentTypes, allExtras] = await Promise.all([
    prisma.filamentType.findMany({ orderBy: { brand: "asc" } }),
    prisma.extra.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestão da Receita de Produção
        </p>
      </div>

      <ProductDetailsClient
        product={product as any}
        filamentTypes={filamentTypes}
        extras={allExtras}
      />
    </div>
  );
}
