import { prisma } from "@/lib/prisma";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      // Trazemos as contagens para saber se o produto já tem histórico
      _count: {
        select: { sales: true, productionLogs: true },
      },
    },
  });

  // Formatamos as datas para passar do Server Component para o Client Component sem erros
  const formattedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Catálogo e Stock
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Faça a gestão das suas "Receitas" 3D e acompanhe o stock físico
        </p>
      </div>
      <InventoryClient initialProducts={formattedProducts as any} />
    </div>
  );
}
