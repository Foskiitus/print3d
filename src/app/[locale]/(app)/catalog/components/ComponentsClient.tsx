"use client";

import { useState, useMemo } from "react";
import {
  Layers,
  Search,
  Trash2,
  Clock,
  Package,
  AlertTriangle,
  FileType,
  Plus,
  Boxes,
  Pencil,
  Check,
  X,
  ChevronDown,
  Filter,
  Euro,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { useIntlayer } from "next-intlayer";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intlayer";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewComponentModal } from "@/components/forms/NewComponentModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilamentReq {
  id: string;
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

interface PrintProfile {
  id: string;
  name: string;
  printTime: number | null;
  filamentUsed: number | null;
  batchSize: number;
  filaments: FilamentReq[];
}

interface BomEntry {
  productId: string;
  product: { id: string; name: string };
}

interface ComponentItem {
  id: string;
  name: string;
  description: string | null;
  defaultMaterial: string | null;
  defaultColorHex: string | null;
  requiresAdapter: boolean;
  specialHandling: string | null;
  profiles: PrintProfile[];
  stock: { quantity: number } | null;
  bom: BomEntry[];
  createdAt: string;
}

interface ComponentsClientProps {
  components: ComponentItem[];
  materialPriceMap: Record<string, number>;
  kwhPrice: number;
  locale: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function calcCost(
  profile: PrintProfile,
  materialPriceMap: Record<string, number>,
  kwhPrice: number,
  powerWatts = 280, // valor médio estimado
): number {
  // Custo de filamento
  const filamentCost = profile.filaments.reduce((acc, f) => {
    const pricePerG = materialPriceMap[f.material] ?? 0.025;
    return acc + f.estimatedG * pricePerG;
  }, 0);

  // Custo de eletricidade
  const printHours = (profile.printTime ?? 0) / 60;
  const electricityCost = (powerWatts / 1000) * printHours * kwhPrice;

  const totalForBatch = filamentCost + electricityCost;
  const batchSize = profile.batchSize || 1;
  return totalForBatch / batchSize;
}

// ─── ProductsTooltip ──────────────────────────────────────────────────────────

function ProductsPopover({
  entries,
  locale,
}: {
  entries: BomEntry[];
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (entries.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-medium hover:bg-primary/20 transition-colors"
      >
        <Package size={8} />
        {entries.length} produto{entries.length !== 1 ? "s" : ""}
        <ChevronDown size={8} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg p-1.5 min-w-[180px]">
            {entries.map((entry) => (
              <button
                key={entry.productId}
                onClick={() => {
                  setOpen(false);
                  router.push(`/${locale}/catalog/${entry.productId}`);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-accent transition-colors truncate"
              >
                {entry.product.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ComponentCard ────────────────────────────────────────────────────────────

function ComponentCard({
  component,
  materialPriceMap,
  kwhPrice,
  locale,
  onDelete,
  onUpdateName,
  onUpdateStock,
}: {
  component: ComponentItem;
  materialPriceMap: Record<string, number>;
  kwhPrice: number;
  locale: string;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateStock: (id: string, qty: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(component.name);
  const [savingName, setSavingName] = useState(false);
  const [editingStock, setEditingStock] = useState(false);
  const [stockValue, setStockValue] = useState(
    String(component.stock?.quantity ?? 0),
  );
  const [savingStock, setSavingStock] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);

  const primaryProfile = component.profiles[0] ?? null;

  // Custo estimado (perfil principal)
  const estimatedCost = primaryProfile
    ? calcCost(primaryProfile, materialPriceMap, kwhPrice)
    : null;

  // Materiais únicos de todos os perfis
  const allFilaments = component.profiles.flatMap((p) => p.filaments);
  const uniqueMaterials = [...new Set(allFilaments.map((f) => f.material))];

  // Dots de cor únicos
  const colorDots = [
    ...new Map(
      allFilaments.filter((f) => f.colorHex).map((f) => [f.colorHex, f]),
    ).values(),
  ].slice(0, 5);

  async function handleDelete() {
    if (component.bom.length > 0) {
      toast({
        title: "Não é possível apagar",
        description: `Usado em ${component.bom.length} produto(s). Remove das BOMs primeiro.`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Apagar "${component.name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/components/${component.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onDelete(component.id);
      toast({ title: `"${component.name}" apagado` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue === component.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/components/${component.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      onUpdateName(component.id, d.name);
      setEditingName(false);
      toast({ title: "Nome atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveStock() {
    const qty = Math.max(0, parseInt(stockValue) || 0);
    setSavingStock(true);
    try {
      const res = await fetch(`/api/components/${component.id}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ quantity: qty }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      onUpdateStock(component.id, qty);
      setEditingStock(false);
      toast({ title: "Stock atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingStock(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-colors",
        component.requiresAdapter ? "border-amber-500/30" : "border-border",
      )}
    >
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {/* Cor primária */}
          <div
            className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center border border-border"
            style={{
              backgroundColor: component.defaultColorHex
                ? `${component.defaultColorHex}25`
                : undefined,
            }}
          >
            <Layers size={15} className="text-muted-foreground" />
          </div>

          {/* Nome + badges */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="h-7 text-sm w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameValue(component.name);
                    }
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="text-primary"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(component.name);
                  }}
                  className="text-muted-foreground"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/name">
                <p className="text-sm font-semibold text-foreground truncate">
                  {component.name}
                </p>
                <button
                  onClick={() => setEditingName(true)}
                  className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={10} />
                </button>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {component.requiresAdapter && (
                <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-0.5">
                  <AlertTriangle size={8} />
                  Requer Adaptador
                </Badge>
              )}
              {uniqueMaterials.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {uniqueMaterials.join(" · ")}
                </span>
              )}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Métricas da linha */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Custo estimado */}
          {estimatedCost !== null && estimatedCost > 0 && (
            <div className="flex items-center gap-1 text-xs text-foreground font-medium">
              <Euro size={11} className="text-emerald-500" />
              {estimatedCost.toFixed(3)}
              <span className="text-muted-foreground font-normal text-[10px]">
                /un
              </span>
            </div>
          )}

          {/* Tempo */}
          {primaryProfile?.printTime && primaryProfile.printTime > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={10} />
              {fmtTime(primaryProfile.printTime)}
              {primaryProfile.batchSize > 1 && (
                <span className="text-emerald-600 text-[9px]">
                  ×{primaryProfile.batchSize}
                </span>
              )}
            </div>
          )}

          {/* Filamento total */}
          {primaryProfile?.filamentUsed && primaryProfile.filamentUsed > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Layers size={10} />
              {primaryProfile.filamentUsed}g
            </div>
          )}

          {/* Dots de cor */}
          {colorDots.length > 0 && (
            <div className="flex items-center gap-1">
              {colorDots.map((f, i) => (
                <div
                  key={i}
                  title={`${f.material}${f.colorName ? ` ${f.colorName}` : ""}`}
                  className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: f.colorHex ?? "#888" }}
                />
              ))}
            </div>
          )}

          {/* Perfis */}
          {component.profiles.length > 0 && (
            <button
              onClick={() => setShowProfiles((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileType size={10} />
              {component.profiles.length} perfil
              {component.profiles.length !== 1 ? "is" : ""}
              <ChevronDown
                size={9}
                className={cn(
                  "transition-transform",
                  showProfiles && "rotate-180",
                )}
              />
            </button>
          )}
        </div>

        {/* Footer: stock + produtos */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {/* Stock editável */}
          <div className="flex items-center gap-1.5">
            <Boxes size={11} className="text-muted-foreground" />
            {editingStock ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  className="w-14 h-6 text-xs text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveStock();
                    if (e.key === "Escape") setEditingStock(false);
                  }}
                />
                <button
                  onClick={handleSaveStock}
                  disabled={savingStock}
                  className="text-primary"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => setEditingStock(false)}
                  className="text-muted-foreground"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setStockValue(String(component.stock?.quantity ?? 0));
                  setEditingStock(true);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/60 transition-colors group/stock"
              >
                <span
                  className={cn(
                    "text-xs font-semibold",
                    (component.stock?.quantity ?? 0) === 0
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {component.stock?.quantity ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground">un.</span>
                <Pencil
                  size={8}
                  className="text-muted-foreground opacity-0 group-hover/stock:opacity-100"
                />
              </button>
            )}
          </div>

          {/* Produtos que usam este componente */}
          <ProductsPopover entries={component.bom} locale={locale} />
        </div>
      </div>

      {/* Perfis expandidos */}
      {showProfiles && component.profiles.length > 0 && (
        <div className="border-t border-border bg-muted/20 p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Perfis de impressão
          </p>
          {component.profiles.map((profile) => {
            const cost = calcCost(profile, materialPriceMap, kwhPrice);
            return (
              <div
                key={profile.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    {profile.name}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {profile.batchSize > 1 && (
                      <span className="text-emerald-600 font-medium">
                        lote ×{profile.batchSize}
                      </span>
                    )}
                    {profile.filamentUsed && (
                      <span className="flex items-center gap-1">
                        <Layers size={9} />
                        {profile.filamentUsed}g
                      </span>
                    )}
                    {profile.printTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        {fmtTime(profile.printTime)}
                      </span>
                    )}
                    {cost > 0 && (
                      <span className="text-emerald-600 font-medium">
                        €{cost.toFixed(3)}/un
                      </span>
                    )}
                  </div>
                </div>
                {profile.filaments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.filaments.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 border border-border"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: f.colorHex ?? "#888" }}
                        />
                        <span className="text-[10px] text-foreground">
                          {f.material}
                          {f.colorName ? ` ${f.colorName}` : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {f.estimatedG}g
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ComponentsClient ─────────────────────────────────────────────────────────

export function ComponentsClient({
  components: initial,
  materialPriceMap,
  kwhPrice,
  locale,
}: ComponentsClientProps) {
  const [components, setComponents] = useState<ComponentItem[]>(initial);
  const [search, setSearch] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const materials = useMemo(() => {
    const set = new Set(
      components.flatMap((c) =>
        c.profiles.flatMap((p) => p.filaments.map((f) => f.material)),
      ),
    );
    return Array.from(set).sort();
  }, [components]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return components.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.defaultMaterial?.toLowerCase().includes(q) ||
        c.profiles.some((p) =>
          p.filaments.some(
            (f) =>
              f.material.toLowerCase().includes(q) ||
              f.colorName?.toLowerCase().includes(q),
          ),
        );
      const matchMaterial =
        !filterMaterial ||
        c.profiles.some((p) =>
          p.filaments.some((f) => f.material === filterMaterial),
        );
      return matchSearch && matchMaterial;
    });
  }, [components, search, filterMaterial]);

  const totalStock = components.reduce(
    (a, c) => a + (c.stock?.quantity ?? 0),
    0,
  );

  const refreshComponents = async () => {
    const res = await fetch("/api/components", {
      headers: { "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "" },
    });
    if (res.ok) setComponents(await res.json());
  };

  function handleDelete(id: string) {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }

  function handleUpdateName(id: string, name: string) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c)),
    );
  }

  function handleUpdateStock(id: string, quantity: number) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stock: { quantity } } : c)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Componentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {components.length} componente{components.length !== 1 ? "s" : ""} ·{" "}
            {totalStock} unidades em stock
          </p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          Novo Componente
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Pesquisar por nome, material…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        {materials.length > 0 && (
          <div className="relative">
            <Filter
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="pl-7 pr-6 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="">Todos os materiais</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <Layers size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            {search || filterMaterial
              ? `Sem resultados para "${search || filterMaterial}"`
              : "Ainda não tens componentes criados."}
          </p>
          {!search && !filterMaterial && (
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
              Cria componentes aqui ou a partir da BOM de um produto.
            </p>
          )}
          {!search && !filterMaterial && (
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Novo Componente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              materialPriceMap={materialPriceMap}
              kwhPrice={kwhPrice}
              locale={locale}
              onDelete={handleDelete}
              onUpdateName={handleUpdateName}
              onUpdateStock={handleUpdateStock}
            />
          ))}
        </div>
      )}

      {/* Modal de novo componente (independente — sem productId) */}
      {newOpen && (
        <NewComponentModal
          onCreated={() => {
            refreshComponents();
            setNewOpen(false);
          }}
          onClose={() => setNewOpen(false)}
        />
      )}
    </div>
  );
}
