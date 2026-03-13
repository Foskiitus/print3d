"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // <-- Importação do Router adicionada
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewProductDialog } from "@/components/forms/NewProductDialog";
import { AddProductionDialog } from "@/components/forms/AddProductionDialog";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  category: string | null;
  printTimeMinutes: number | null;
  recommendedPrice: number;
  stockLevel: number;
  _count?: { sales: number; productionLogs: number };
};

export function InventoryClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const router = useRouter(); // <-- Inicialização do Router

  const refresh = useCallback(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  function stockBadge(level: number) {
    if (level === 0) return <Badge variant="destructive">Sem stock</Badge>;
    if (level <= 2) return <Badge variant="warning">Baixo ({level})</Badge>;
    return <Badge variant="success">{level} un.</Badge>;
  }

  function formatPrintTime(minutes: number | null) {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} modelos registados
        </p>
        <div className="flex gap-2">
          <AddProductionDialog products={products} onAdded={refresh} />
          <NewProductDialog onCreated={refresh} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Modelo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Categoria
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tempo Est.
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Preço Venda
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/inventory/${p.id}`)} // <-- Navega para a página de detalhes ao clicar
                    className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    {/* Adicionámos um efeito no texto do nome para mostrar que é clicável */}
                    <td className="px-4 py-3 font-medium text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatPrintTime(p.printTimeMinutes)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(p.recommendedPrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stockBadge(p.stockLevel)}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                    >
                      Nenhum modelo registado. Crie a sua primeira "Receita" de
                      impressão!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
