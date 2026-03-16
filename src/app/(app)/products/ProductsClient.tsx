"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Package, Clock, Layers, Printer } from "lucide-react";
import { NewProductDialog } from "@/components/forms/NewProductDialog";
import { StorageImage } from "@/components/StorageImage";
import { toast } from "@/components/ui/toaster";

export function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: any[];
  categories: any[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const refreshProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Eliminar este produto?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Produto eliminado" });
      refreshProducts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filtered = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  // Agrupar por impressora
  const grouped: {
    printerId: string | null;
    printerName: string;
    products: any[];
  }[] = [];
  const seen = new Set<string>();

  for (const p of filtered) {
    const key = p.printerId ?? "__none__";
    if (!seen.has(key)) {
      seen.add(key);
      grouped.push({
        printerId: p.printerId ?? null,
        printerName: p.printer?.name ?? "Sem impressora",
        products: [],
      });
    }
    grouped
      .find((g) => g.printerId === (p.printerId ?? null))!
      .products.push(p);
  }

  grouped.sort((a, b) => {
    if (a.printerId === null) return 1;
    if (b.printerId === null) return -1;
    return a.printerName.localeCompare(b.printerName);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtro por categoria */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.id,
            ).length;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory((prev) =>
                    prev === cat.id ? null : cat.id,
                  )
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
        <NewProductDialog onCreated={refreshProducts} />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg py-16 text-center">
          <Package
            size={32}
            className="text-muted-foreground/40 mx-auto mb-3"
          />
          <p className="text-sm text-muted-foreground">
            Nenhum produto encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.printerId ?? "__none__"} className="space-y-4">
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2">
                <Printer size={14} className="text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {group.printerName}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {group.products.length} produto(s)
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Grid de produtos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.products.map((product) => (
                  <Card
                    key={product.id}
                    className="group cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {product.imageUrl ? (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <StorageImage
                          src={product.imageKey ?? product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted/40 flex items-center justify-center">
                        <Package
                          size={32}
                          className="text-muted-foreground/30"
                        />
                      </div>
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">
                            {product.name}
                          </p>
                          {product.category && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {product.category.name}
                            </p>
                          )}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(e, product.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                        {product.productionTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {Math.floor(product.productionTime / 60) > 0 &&
                              `${Math.floor(product.productionTime / 60)}h `}
                            {product.productionTime % 60 > 0 &&
                              `${product.productionTime % 60}min`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Layers size={10} />
                          {product.filamentUsage.length} filamento(s)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
