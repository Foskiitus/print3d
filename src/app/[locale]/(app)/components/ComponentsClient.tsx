"use client";

// src/app/[locale]/(app)/components/ComponentsClient.tsx

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  AlertTriangle,
  FileType,
  Plus,
  Boxes,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";

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
  bom: { productId: string }[];
  createdAt: string;
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

// ─── Component Row ────────────────────────────────────────────────────────────

function ComponentRow({
  component,
  onDelete,
  onUpdateName,
  onUpdateStock,
}: {
  component: ComponentItem;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateStock: (id: string, qty: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(component.name);
  const [savingName, setSavingName] = useState(false);
  const [editingStock, setEditingStock] = useState(false);
  const [stockValue, setStockValue] = useState(
    String(component.stock?.quantity ?? 0),
  );
  const [savingStock, setSavingStock] = useState(false);

  const primaryProfile = component.profiles[0];
  const totalFilaments = component.profiles.flatMap((p) => p.filaments);
  const uniqueMaterials = [...new Set(totalFilaments.map((f) => f.material))];
  const usedInProducts = component.bom.length;

  async function handleDelete() {
    if (usedInProducts > 0) {
      toast({
        title: "Não é possível apagar",
        description: `Este componente está a ser usado em ${usedInProducts} produto${usedInProducts !== 1 ? "s" : ""}. Remove-o das BOMs primeiro.`,
        variant: "destructive",
      });
      return;
    }
    if (
      !confirm(`Apagar "${component.name}"? Esta ação não pode ser desfeita.`)
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/components/${component.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header da linha */}
      <div className="flex items-center gap-3 p-4">
        {/* Cor do material primário */}
        <div
          className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center border border-border"
          style={{
            backgroundColor: component.defaultColorHex
              ? `${component.defaultColorHex}20`
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
                className="h-7 text-sm w-52"
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
                type="button"
                onClick={handleSaveName}
                disabled={savingName}
                className="text-primary"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameValue(component.name);
                }}
                className="text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group/name">
              <p className="text-sm font-semibold text-foreground truncate">
                {component.name}
              </p>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {uniqueMaterials.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {uniqueMaterials.join(" · ")}
              </span>
            )}
            {component.requiresAdapter && (
              <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                adaptador
              </Badge>
            )}
            {usedInProducts > 0 && (
              <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
                <Package size={8} className="mr-0.5" />
                {usedInProducts} produto{usedInProducts !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Boxes size={12} className="text-muted-foreground" />
          {editingStock ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                className="w-16 h-7 text-xs text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveStock();
                  if (e.key === "Escape") setEditingStock(false);
                }}
              />
              <button
                type="button"
                onClick={handleSaveStock}
                disabled={savingStock}
                className="text-primary"
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStockValue(String(component.stock?.quantity ?? 0));
                setEditingStock(true);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/60 transition-colors group/stock"
            >
              <span className="text-xs font-medium text-foreground">
                {component.stock?.quantity ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground">un.</span>
              <Pencil
                size={9}
                className="text-muted-foreground opacity-0 group-hover/stock:opacity-100"
              />
            </button>
          )}
        </div>

        {/* Perfis count */}
        <div className="flex items-center gap-1 flex-shrink-0 text-[10px] text-muted-foreground">
          <FileType size={11} />
          {component.profiles.length} perfil
          {component.profiles.length !== 1 ? "s" : ""}
        </div>

        {/* Expand + delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground/40 hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {/* Descrição / handling */}
          {(component.description || component.specialHandling) && (
            <div className="space-y-1">
              {component.description && (
                <p className="text-xs text-muted-foreground">
                  {component.description}
                </p>
              )}
              {component.specialHandling && (
                <p className="text-xs text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle size={11} />
                  {component.specialHandling}
                </p>
              )}
            </div>
          )}

          {/* Perfis de impressão */}
          {component.profiles.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Sem perfis de impressão definidos.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Perfis de impressão
              </p>
              {component.profiles.map((profile) => (
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
                          lote {profile.batchSize}
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
                    </div>
                  </div>
                  {/* Filamentos do perfil */}
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ComponentsClient({
  components: initial,
  locale,
}: {
  components: ComponentItem[];
  locale: string;
}) {
  const [components, setComponents] = useState<ComponentItem[]>(initial);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return components;
    return components.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.defaultMaterial?.toLowerCase().includes(q) ||
        c.profiles.some((p) =>
          p.filaments.some(
            (f) =>
              f.material.toLowerCase().includes(q) ||
              f.colorName?.toLowerCase().includes(q),
          ),
        ),
    );
  }, [components, search]);

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Componentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {components.length} componente{components.length !== 1 ? "s" : ""} ·{" "}
            {components.reduce((a, c) => a + (c.stock?.quantity ?? 0), 0)}{" "}
            unidades em stock
          </p>
        </div>
      </div>

      {/* Pesquisa */}
      <div className="relative max-w-sm">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Pesquisar por nome, material…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <Layers size={32} className="text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {search
              ? `Sem resultados para "${search}"`
              : "Ainda não tens componentes criados."}
          </p>
          {!search && (
            <p className="text-xs text-muted-foreground">
              Cria componentes a partir da página de detalhe de um produto.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
              onDelete={handleDelete}
              onUpdateName={handleUpdateName}
              onUpdateStock={handleUpdateStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
