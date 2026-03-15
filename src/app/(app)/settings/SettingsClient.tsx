"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Tag, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewCategoryDialog } from "@/components/forms/NewCategoryDialog";
import { NewExtraDialog } from "@/components/forms/NewExtraDialog";
import { toast } from "@/components/ui/toaster";

export function SettingsClient({
  initialCategories,
  initialExtras,
}: {
  initialCategories: any[];
  initialExtras: any[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [extras, setExtras] = useState(initialExtras);

  const refreshCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  };

  const refreshExtras = async () => {
    const res = await fetch("/api/extras");
    if (res.ok) setExtras(await res.json());
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Eliminar esta categoria? Os produtos associados ficarão sem categoria.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Categoria eliminada" });
      refreshCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!confirm("Eliminar este extra?")) return;
    try {
      const res = await fetch(`/api/extras/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Extra eliminado" });
      refreshExtras();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Secção: Categorias ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Categorias
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {categories.length}
            </Badge>
          </div>
          <NewCategoryDialog onCreated={refreshCategories} />
        </div>

        {categories.length === 0 ? (
          <div className="border border-dashed rounded-lg py-10 text-center">
            <Tag size={24} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria criada.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Cria categorias para organizar os teus produtos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-muted">
                    <Badge variant="secondary" className="text-[10px]">
                      {cat._count?.products || 0} produto(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Secção: Extras ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Extras
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {extras.length}
            </Badge>
          </div>
          <NewExtraDialog onCreated={refreshExtras} />
        </div>

        {extras.length === 0 ? (
          <div className="border border-dashed rounded-lg py-10 text-center">
            <Package
              size={24}
              className="text-muted-foreground/40 mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Nenhum extra criado.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Adiciona materiais extra como correntes, parafusos, cola, etc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {extras.map((extra) => (
              <Card
                key={extra.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {extra.name}
                      </p>
                      {extra.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {extra.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteExtra(extra.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-muted flex items-center justify-between">
                    <span className="text-sm font-bold">
                      {formatCurrency(extra.price)}
                      {extra.unit && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          / {extra.unit}
                        </span>
                      )}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {extra._count?.usages || 0} produto(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
