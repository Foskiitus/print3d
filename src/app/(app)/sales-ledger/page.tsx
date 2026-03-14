import { prisma } from "@/lib/prisma";
import { SalesClient } from "./SalesClient";

export default async function SalesLedgerPage() {
  // 1. Vamos buscar as vendas com os produtos associados
  const sales = await prisma.sale.findMany({
    include: { product: true },
    orderBy: { date: "desc" },
  });

  // 2. Vamos buscar a lista de todos os produtos disponíveis para o formulário de Nova Venda
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Vendas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registre vendas e consulte o histórico de transações
        </p>
      </div>

      <SalesClient
        initialSales={sales.map((s) => ({
          ...s,
          date: s.date.toISOString(),
          product: {
            ...s.product,
            createdAt: s.product.createdAt.toISOString(),
            updatedAt: s.product.updatedAt.toISOString(),
          },
        }))}
        // 3. Adicionamos a propriedade 'products' que o TypeScript estava a pedir
        products={products.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
