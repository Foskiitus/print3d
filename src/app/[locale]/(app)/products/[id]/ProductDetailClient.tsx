"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Layers,
  Euro,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  Tag,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Wrench,
  ArrowLeft,
  PenLine,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/components/ui/toaster";
import { NewComponentModal } from "@/components/forms/NewComponentModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
}

interface FilamentReq {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

interface ComponentProfile {
  id: string;
  name: string;
  printTime: number | null;
  filamentUsed: number | null;
  filaments: FilamentReq[];
}

interface Component {
  id: string;
  name: string;
  description: string | null;
  stock: { quantity: number } | null;
  profiles: ComponentProfile[];
}

interface BOMEntry {
  id: string;
  componentId: string;
  quantity: number;
  component: Component;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  margin: number;
  categoryId: string | null;
  category: Category | null;
  alertThreshold: number | null;
  bom: BOMEntry[];
  extras: {
    id: string;
    quantity: number;
    extra: { id: string; name: string; price: number; unit: string | null };
  }[];
  sales: { id: string; date: string; quantity: number; salePrice: number }[];
}

// ─── BOM Entry Row ────────────────────────────────────────────────────────────

function BOMRow({
  entry,
  onUpdateQty,
  onRemove,
}: {
  entry: BOMEntry;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(String(entry.quantity));
  const inStock = entry.component.stock?.quantity ?? 0;
  const totalNeeded = entry.quantity;
  const hasStock = inStock >= totalNeeded;

  const totalFilamentG = entry.component.profiles.reduce(
    (acc, p) => acc + (p.filamentUsed ?? 0),
    0,
  );

  const primaryProfile = entry.component.profiles[0];
  const primaryFilament = primaryProfile?.filaments[0];
  const batchSize = (primaryProfile as any)?.batchSize ?? 1;
  const unitG = primaryProfile?.filamentUsed
    ? Math.round((primaryProfile.filamentUsed / batchSize) * 10) / 10
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors group">
      {/* Cor do material */}
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: primaryFilament?.colorHex
            ? `${primaryFilament.colorHex}20`
            : "var(--color-background-secondary)",
        }}
      >
        <Layers size={14} className="text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">
            {entry.component.name}
          </p>
          {(entry.component as any).requiresAdapter && (
            <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
              <Wrench size={8} className="mr-0.5" />
              adaptador
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {primaryFilament && (
            <span className="text-[10px] text-muted-foreground">
              {primaryFilament.material}
              {primaryFilament.colorName ? ` ${primaryFilament.colorName}` : ""}
            </span>
          )}
          {unitG !== null && (
            <span className="text-[10px] text-muted-foreground">
              · {unitG}g/un
              {batchSize > 1 && (
                <span className="ml-1 text-emerald-600 font-medium">
                  (lote {batchSize})
                </span>
              )}
            </span>
          )}
          {entry.component.profiles.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              · {entry.component.profiles.length} receita
              {entry.component.profiles.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {(entry.component as any).specialHandling && (
          <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5">
            <AlertTriangle size={9} />
            {(entry.component as any).specialHandling}
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {hasStock ? (
          <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
            <CheckCircle2 size={9} />
            {inStock} em stock
          </span>
        ) : (
          <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
            <AlertCircle size={9} />
            {inStock}/{totalNeeded}
          </span>
        )}
      </div>

      {/* Quantidade */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {editingQty ? (
          <>
            <Input
              type="number"
              min="1"
              value={qtyValue}
              onChange={(e) => setQtyValue(e.target.value)}
              className="w-14 h-7 text-xs text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = Math.max(1, parseInt(qtyValue) || 1);
                  onUpdateQty(entry.id, n);
                  setEditingQty(false);
                }
                if (e.key === "Escape") setEditingQty(false);
              }}
            />
            <button
              type="button"
              onClick={() => {
                const n = Math.max(1, parseInt(qtyValue) || 1);
                onUpdateQty(entry.id, n);
                setEditingQty(false);
              }}
              className="text-primary"
            >
              <Check size={13} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setQtyValue(String(entry.quantity));
              setEditingQty(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/60 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              ×{entry.quantity}
            </span>
            <Pencil
              size={10}
              className="text-muted-foreground opacity-0 group-hover:opacity-100"
            />
          </button>
        )}
      </div>

      {/* Remover */}
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-1 flex-shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ─── Add Component Picker ─────────────────────────────────────────────────────

function AddComponentPicker({
  allComponents,
  existingIds,
  productId,
  onAdded,
}: {
  allComponents: Component[];
  existingIds: string[];
  productId: string;
  onAdded: (entry: BOMEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const available = allComponents.filter(
    (c) =>
      !existingIds.includes(c.id) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.profiles[0]?.filaments[0]?.material
          .toLowerCase()
          .includes(search.toLowerCase())),
  );

  async function handleAdd(component: Component) {
    setLoadingId(component.id);
    try {
      const res = await fetch(`/api/products/${productId}/bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: component.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(data);
      setOpen(false);
      setSearch("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-sm text-muted-foreground"
      >
        <Plus size={13} />
        Adicionar componente à BOM
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Escolher componente
        </span>
        <button type="button" onClick={() => setOpen(false)}>
          <X
            size={13}
            className="text-muted-foreground hover:text-foreground"
          />
        </button>
      </div>
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Pesquisar componentes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-7 h-7 text-xs"
          autoFocus
        />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {available.length === 0 && (
          <div className="py-3 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              {search
                ? `Sem resultados para "${search}"`
                : "Todos os componentes já estão na BOM."}
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-1.5 w-full p-2 rounded-lg border border-dashed border-primary/40 hover:bg-primary/5 transition-colors text-xs text-primary font-medium"
            >
              <PenLine size={12} />
              {search
                ? `Criar "${search}" como novo componente`
                : "Criar novo componente"}
            </button>
          </div>
        )}
        {available.map((c) => {
          const pf = c.profiles[0]?.filaments[0];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleAdd(c)}
              disabled={loadingId === c.id}
              className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/60 transition-colors text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-foreground truncate">
                    {c.name}
                  </p>
                  {(c as any).requiresAdapter && (
                    <AlertTriangle
                      size={10}
                      className="text-amber-500 flex-shrink-0"
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {pf
                    ? `${pf.material}${pf.colorName ? ` ${pf.colorName}` : ""}`
                    : "Sem perfil"}
                  {c.stock && ` · ${c.stock.quantity} em stock`}
                </p>
              </div>
              <Plus
                size={12}
                className="text-muted-foreground flex-shrink-0 ml-2"
              />
            </button>
          );
        })}
      </div>

      {/* Botão criar novo — sempre visível no fundo */}
      {available.length > 0 && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 w-full p-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <PenLine size={10} />
          Criar novo componente
        </button>
      )}

      {showCreateModal && (
        <NewComponentModal
          initialName={search}
          productId={productId}
          onCreated={(entry) => {
            onAdded(entry);
            setOpen(false);
            setSearch("");
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductDetailClient({
  product: initialProduct,
  allComponents,
  categories,
  estimatedCost,
  suggestedPrice,
  estimatedMinutes,
  backHref,
}: {
  product: Product;
  allComponents: Component[];
  categories: Category[];
  estimatedCost: number;
  suggestedPrice: number;
  estimatedMinutes?: number;
  backHref?: string;
}) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [bom, setBom] = useState<BOMEntry[]>(initialProduct.bom);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(initialProduct.name);
  const [savingName, setSavingName] = useState(false);

  // Custo calculado localmente
  const FALLBACK_PRICE_PER_G = 0.025;
  const currentBomCost = bom.reduce((acc, entry) => {
    const g = entry.component.profiles.reduce(
      (s, p) => s + (p.filamentUsed ?? 0),
      0,
    );
    return acc + entry.quantity * g * FALLBACK_PRICE_PER_G;
  }, 0);
  const extrasCost = product.extras.reduce(
    (acc, e) => acc + e.quantity * e.extra.price,
    0,
  );
  const currentEstimatedCost = currentBomCost + extrasCost;
  const currentSuggestedPrice = currentEstimatedCost * (1 + product.margin);

  const allInStock = bom.every(
    (e) => (e.component.stock?.quantity ?? 0) >= e.quantity,
  );

  // ── Editar nome ────────────────────────────────────────────────────────────
  async function handleSaveName() {
    if (!nameValue.trim() || nameValue === product.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduct((p) => ({ ...p, name: data.name }));
      setEditingName(false);
      toast({ title: "Nome atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  // ── BOM: atualizar quantidade ─────────────────────────────────────────────
  async function handleUpdateBOMQty(bomId: string, quantity: number) {
    try {
      const res = await fetch(`/api/products/${product.id}/bom/${bomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      setBom((prev) =>
        prev.map((e) => (e.id === bomId ? { ...e, quantity } : e)),
      );
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  // ── BOM: remover componente ───────────────────────────────────────────────
  async function handleRemoveBOM(bomId: string) {
    try {
      const res = await fetch(`/api/products/${product.id}/bom/${bomId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover");
      setBom((prev) => prev.filter((e) => e.id !== bomId));
      toast({ title: "Componente removido da BOM" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="h-8 text-lg font-bold w-72"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setNameValue(product.name);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingName}
                className="text-primary"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameValue(product.name);
                }}
                className="text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-xl font-bold text-foreground truncate">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
          {product.category && (
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Tag size={11} />
              {product.category.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {allInStock && bom.length > 0 ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              <CheckCircle2 size={10} className="mr-1" />
              Pronto para montar
            </Badge>
          ) : bom.length === 0 ? (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
              <AlertCircle size={10} className="mr-1" />
              BOM vazia
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Layout 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal — BOM */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Lista de Materiais (BOM)
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {bom.length === 0
                      ? "Adiciona os componentes que constituem este produto."
                      : `${bom.length} componente${bom.length !== 1 ? "s" : ""} · ${bom.reduce((a, e) => a + e.quantity, 0)} peças no total`}
                  </p>
                </div>
                <Layers size={14} className="text-muted-foreground" />
              </div>

              {bom.length === 0 ? (
                <div className="py-6 text-center">
                  <Layers
                    size={28}
                    className="text-muted-foreground mx-auto mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este produto ainda não tem componentes definidos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bom.map((entry) => (
                    <BOMRow
                      key={entry.id}
                      entry={entry}
                      onUpdateQty={handleUpdateBOMQty}
                      onRemove={handleRemoveBOM}
                    />
                  ))}
                </div>
              )}

              <AddComponentPicker
                allComponents={allComponents}
                existingIds={bom.map((e) => e.componentId)}
                productId={product.id}
                onAdded={(entry) => setBom((prev) => [...prev, entry])}
              />
            </CardContent>
          </Card>

          {/* Extras */}
          {product.extras.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Extras
                </h2>
                <div className="space-y-2">
                  {product.extras.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {e.extra.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {e.quantity} {e.extra.unit ?? "un"} ×{" "}
                          {formatCurrency(e.extra.price)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(e.quantity * e.extra.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vendas recentes */}
          {product.sales.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Vendas Recentes
                </h2>
                <div className="space-y-2">
                  {product.sales.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40"
                    >
                      <div>
                        <p className="text-xs text-foreground">
                          {format(new Date(s.date), "dd MMM yyyy")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.quantity} unid.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(s.salePrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna lateral — Custos e Configuração */}
        <div className="space-y-4">
          {/* Custo estimado */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Estimativa de Custo
                </h2>
                <Euro size={14} className="text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Filamento</span>
                  <span className="text-foreground">
                    {formatCurrency(currentBomCost)}
                  </span>
                </div>
                {extrasCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Extras</span>
                    <span className="text-foreground">
                      {formatCurrency(extrasCost)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-border pt-2">
                  <span className="text-muted-foreground font-medium">
                    Custo total
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(currentEstimatedCost)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp size={11} />
                    Preço sugerido ({Math.round(product.margin * 100)}% margem)
                  </span>
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(currentSuggestedPrice)}
                </p>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Custo de filamento calculado com €0.025/g estimado. Configura
                rolos com preço real para valores precisos.
              </p>
            </CardContent>
          </Card>

          {/* Configuração */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">
                Configuração
              </h2>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Margem (%)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={product.margin}
                      className="h-8 text-sm"
                      onBlur={async (e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val === product.margin) return;
                        try {
                          await fetch(`/api/products/${product.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ margin: val }),
                          });
                          setProduct((p) => ({ ...p, margin: val }));
                        } catch {
                          /* silent */
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      = {Math.round(product.margin * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Alerta de stock (unidades)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={product.alertThreshold ?? ""}
                    placeholder="Sem alerta"
                    className="h-8 text-sm"
                    onBlur={async (e) => {
                      const val = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      try {
                        await fetch(`/api/products/${product.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ alertThreshold: val }),
                        });
                      } catch {
                        /* silent */
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Categoria
                  </Label>
                  <Select
                    defaultValue={product.categoryId ?? "none"}
                    onValueChange={async (val) => {
                      const categoryId = val === "none" ? null : val;
                      try {
                        await fetch(`/api/products/${product.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ categoryId }),
                        });
                        setProduct((p) => ({ ...p, categoryId }));
                      } catch {
                        /* silent */
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Sem categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
