"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Package,
  Clock,
  Layers,
  Tag,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewProductDialog } from "@/components/forms/NewProductDialog";
import { StorageImage } from "@/components/StorageImage";
import { toast } from "@/components/ui/toaster";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  categoryId: string | null;
  category: Category | null;
  margin: number;
  componentCount: number;
  estimatedMinutes: number;
  totalFilamentG: number;
  stockReady: boolean;
  materials: string[];
  alertThreshold: number | null;
  _count: { sales: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group"
      onClick={() => router.push(`/${locale}/products/${product.id}`)}
    >
      {/* Imagem */}
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
          <Package size={32} className="text-muted-foreground/30" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Nome + delete */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{product.name}</p>
            {product.category && (
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Tag size={9} />
                {product.category.name}
              </p>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => onDelete(e, product.id)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {(product.estimatedMinutes ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatTime(product.estimatedMinutes ?? 0)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Layers size={10} />
            {product.componentCount ?? product.bom?.length ?? 0} peça
            {(product.componentCount ?? product.bom?.length ?? 0) !== 1
              ? "s"
              : ""}
          </span>
          {(product.totalFilamentG ?? 0) > 0 && (
            <span>{product.totalFilamentG}g</span>
          )}
        </div>

        {/* Materiais */}
        {(product.materials ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(product.materials ?? []).slice(0, 3).map((m) => (
              <Badge
                key={m}
                variant="outline"
                className="text-[9px] px-1.5 py-0"
              >
                {m}
              </Badge>
            ))}
            {product.materials.length > 3 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                +{product.materials.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Estado do stock de componentes */}
        {(product.componentCount ?? product.bom?.length ?? 0) === 0 ? (
          <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-amber-500/5 border border-amber-500/20">
            <AlertCircle size={10} className="text-amber-500 flex-shrink-0" />
            <span className="text-[9px] text-amber-600">BOM vazia</span>
          </div>
        ) : (product.stockReady ?? false) ? (
          <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/20">
            <CheckCircle2
              size={10}
              className="text-emerald-500 flex-shrink-0"
            />
            <span className="text-[9px] text-emerald-600">
              Componentes em stock
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40 border border-border">
            <Layers size={10} className="text-muted-foreground flex-shrink-0" />
            <span className="text-[9px] text-muted-foreground">
              Necessita impressão
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const { locale } = useLocale();
  const c = useIntlayer("products");
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refreshProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(c.toast.confirmDelete.value)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.productDeleted.value });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filtrar por categoria e pesquisa
  const filtered = products.filter((p) => {
    const matchCat = !selectedCategory || p.categoryId === selectedCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.materials.some((m) => m.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Agrupar por categoria (substituiu o agrupamento por impressora)
  const grouped: { category: Category | null; products: Product[] }[] = [];
  const seen = new Set<string | null>();

  for (const p of filtered) {
    const key = p.categoryId ?? null;
    if (!seen.has(key)) {
      seen.add(key);
      grouped.push({ category: p.category ?? null, products: [] });
    }
    grouped.find((g) => (g.category?.id ?? null) === key)!.products.push(p);
  }

  // Categorias com produtos primeiro, sem categoria por último
  grouped.sort((a, b) => {
    if (a.category === null) return 1;
    if (b.category === null) return -1;
    return a.category.name.localeCompare(b.category.name);
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtros de categoria */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {c.catalogue.allFilter.value} ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.id,
            ).length;
            if (count === 0) return null;
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

        <div className="flex items-center gap-2">
          {/* Pesquisa */}
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Pesquisar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-sm w-40"
            />
          </div>
          <NewProductDialog onCreated={refreshProducts} />
        </div>
      </div>

      {/* Conteúdo */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg py-16 text-center">
          <Package
            size={32}
            className="text-muted-foreground/40 mx-auto mb-3"
          />
          <p className="text-sm text-muted-foreground">
            {search
              ? `Sem resultados para "${search}"`
              : c.catalogue.empty.value}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.category?.id ?? "__none__"} className="space-y-4">
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {group.category?.name ?? "Sem categoria"}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {group.products.length} {c.catalogue.productCount.value}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Grid de produtos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
