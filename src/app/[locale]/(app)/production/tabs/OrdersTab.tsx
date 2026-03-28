"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Wrench,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle2,
  ClipboardList,
  Link2,
  AlertTriangle,
  Pencil,
  Info,
  PlayCircle,
  StopCircle,
  Loader2,
  X,
  Package,
  ArchiveIcon,
  Box,
  Cpu,
  Hammer,
  CircleDot,
  Circle,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type {
  ProductionOrder,
  Product,
  OrderItem,
} from "../ProductionPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Conta o número de perfis de impressão de um produto
// (via printProfiles directo ou via BOM dos componentes)
function getProductProfiles(p: Product): { id: string }[] {
  if ((p as any).printProfiles?.length > 0) return (p as any).printProfiles;
  return (
    (p as any).bom?.flatMap((entry: any) => entry.component?.profiles ?? []) ??
    []
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: {
    label: "Rascunho",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  pending: {
    label: "Pendente",
    color: "text-amber-600",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  in_progress: {
    label: "Em Produção",
    color: "text-blue-600",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  assembly: {
    label: "Montagem",
    color: "text-purple-600",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  done: {
    label: "Concluída",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelada",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
};

// Status dos Print Jobs (diferente dos status das OPs)
const JOB_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Planeado",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  printing: {
    label: "A Imprimir",
    color: "text-blue-600",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  done: {
    label: "Concluído",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  failed: {
    label: "Falhou",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  cancelled: {
    label: "Cancelado",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
};

// Transições manuais de estado da OP.
// "pending → in_progress" só acontece via Planeador (ao lançar o 1º job).
// "done" é tratado pela action "complete" com modal de registo.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["cancelled"],
  in_progress: ["assembly", "cancelled"],
  assembly: [],
  done: [],
  cancelled: [],
};

// Mensagem exibida quando o utilizador tenta avançar para in_progress manualmente
const PLANNER_REQUIRED_MSG =
  "Usa o Planeador de Mesas para atribuir esta ordem a uma impressora. " +
  "A OP avança automaticamente para 'Em Produção' quando o primeiro job é lançado.";

// ─── Needs summary ────────────────────────────────────────────────────────────

function calcNeeds(items: OrderItem[]) {
  const filamentG: Record<string, number> = {};

  for (const item of items) {
    for (const bomEntry of item.product.bom) {
      const profile = bomEntry.component.profiles[0];
      if (!profile) continue;
      for (const f of profile.filaments) {
        const key = `${f.material}${f.colorHex ?? ""}`;
        filamentG[key] =
          (filamentG[key] ?? 0) +
          f.estimatedG * item.quantity * bomEntry.quantity;
      }
    }
  }

  const totalG = Object.values(filamentG).reduce((a, b) => a + b, 0);
  return { totalG };
}

// ─── New Order Dialog ─────────────────────────────────────────────────────────

function NewOrderDialog({
  open,
  onOpenChange,
  products,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  onCreated: () => void;
}) {
  const c = useIntlayer("production");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    [{ productId: "", quantity: 1 }],
  );
  const [origin, setOrigin] = useState<"manual" | "sale">("manual");
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");

  function reset() {
    setItems([{ productId: "", quantity: 1 }]);
    setOrigin("manual");
    setNotes("");
    setProductSearch("");
  }

  async function handleSubmit() {
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "Adiciona pelo menos um produto",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          items: validItems,
          origin,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.orders.toast.created.value });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Produto seleccionado (só um de cada vez no picker — adicionamos à lista)
  function handleSelectProduct(productId: string) {
    const alreadyInList = items.some((i) => i.productId === productId);
    if (alreadyInList) {
      // Se já está, incrementar quantidade
      setItems((prev) =>
        prev.map((it) =>
          it.productId === productId
            ? { ...it, quantity: it.quantity + 1 }
            : it,
        ),
      );
    } else {
      // Substituir o primeiro item vazio, ou adicionar novo
      const emptyIdx = items.findIndex((i) => !i.productId);
      if (emptyIdx >= 0) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === emptyIdx ? { productId, quantity: 1 } : it,
          ),
        );
      } else {
        setItems((prev) => [...prev, { productId, quantity: 1 }]);
      }
    }
    setProductSearch("");
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const selectedProductIds = new Set(
    items.map((i) => i.productId).filter(Boolean),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{c.orders.dialog.titleNew.value}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* ── Destino ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Destino
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrigin("manual")}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-3 rounded-lg border text-left transition-colors",
                  origin === "manual"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                    origin === "manual"
                      ? "border-primary bg-primary"
                      : "border-border",
                  )}
                >
                  {origin === "manual" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      origin === "manual" ? "text-primary" : "text-foreground",
                    )}
                  >
                    Para Stock
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Produção interna
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOrigin("sale")}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-3 rounded-lg border text-left transition-colors",
                  origin === "sale"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                    origin === "sale"
                      ? "border-primary bg-primary"
                      : "border-border",
                  )}
                >
                  {origin === "sale" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      origin === "sale" ? "text-primary" : "text-foreground",
                    )}
                  >
                    Encomenda
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Para cliente
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── Pesquisa e seleção de produto ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Produtos
            </Label>
            {/* Campo de pesquisa */}
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Pesquisar produto…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-7 h-8 text-xs"
                autoComplete="off"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Lista de produtos — estilo PreFlight */}
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border/50">
              {products.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sem produtos criados.
                </p>
              )}
              {filteredProducts.length === 0 && products.length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Sem resultados para "{productSearch}"
                </p>
              )}
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const profileCount = getProductProfiles(p).length;
                const hasProfiles = profileCount > 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => hasProfiles && handleSelectProduct(p.id)}
                    disabled={!hasProfiles}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors",
                      !hasProfiles
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : "hover:bg-muted/40",
                    )}
                  >
                    {/* Radio indicator */}
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: isSelected
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                        backgroundColor: isSelected
                          ? "hsl(var(--primary))"
                          : "transparent",
                      }}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm flex-1 truncate",
                        isSelected
                          ? "text-primary font-medium"
                          : "text-foreground",
                      )}
                    >
                      {p.name}
                    </span>
                    {hasProfiles ? (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {profileCount} perfil{profileCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 italic">
                        sem perfil
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Itens selecionados com quantidade ── */}
          {items.some((i) => i.productId) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quantidades
              </Label>
              <div className="space-y-2">
                {items
                  .filter((i) => i.productId)
                  .map((item, i) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );
                    if (!product) return null;
                    const realIdx = items.indexOf(item);
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border"
                      >
                        <span className="text-xs text-foreground flex-1 truncate">
                          {product.name}
                        </span>
                        {/* Stepper +/- igual ao PreFlight */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === realIdx
                                    ? {
                                        ...it,
                                        quantity: Math.max(1, it.quantity - 1),
                                      }
                                    : it,
                                ),
                              )
                            }
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === realIdx
                                    ? { ...it, quantity: it.quantity + 1 }
                                    : it,
                                ),
                              )
                            }
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        {/* Remover */}
                        <button
                          type="button"
                          onClick={() =>
                            setItems((prev) =>
                              prev.filter((_, idx) => idx !== realIdx),
                            )
                          }
                          className="text-muted-foreground/40 hover:text-destructive transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Preview da BOM ── */}
          {items.some((i) => i.productId) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Receita (BOM)
              </Label>
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 max-h-48 overflow-y-auto">
                {items
                  .filter((i) => i.productId)
                  .map((item) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );
                    if (!product) return null;
                    const bom = (product as any).bom ?? [];
                    const extras = (product as any).extras ?? [];
                    if (bom.length === 0 && extras.length === 0) {
                      return (
                        <p
                          key={item.productId}
                          className="text-[10px] text-muted-foreground italic"
                        >
                          {product.name}: sem BOM definida.
                        </p>
                      );
                    }
                    return (
                      <div key={item.productId} className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                          <Box size={10} className="text-muted-foreground" />
                          {item.quantity}× {product.name}
                        </p>
                        <div className="pl-3 space-y-1">
                          {bom.map((entry: any) => {
                            const needed = entry.quantity * item.quantity;
                            const profile = entry.component?.profiles?.[0];
                            return (
                              <div
                                key={entry.id ?? entry.component?.id}
                                className="flex items-start gap-2"
                              >
                                <Cpu
                                  size={9}
                                  className="text-muted-foreground flex-shrink-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-foreground">
                                    <span className="font-medium">
                                      {needed}×
                                    </span>{" "}
                                    {entry.component?.name}
                                  </p>
                                  {profile?.filaments?.length > 0 && (
                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                      {profile.filaments
                                        .slice(0, 4)
                                        .map((f: any, i: number) => (
                                          <span
                                            key={i}
                                            className="flex items-center gap-0.5"
                                          >
                                            <div
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  f.colorHex ?? "#888",
                                              }}
                                            />
                                            <span className="text-[9px] text-muted-foreground">
                                              {f.material} {f.estimatedG}g
                                            </span>
                                          </span>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {extras.map((pe: any) => (
                            <div
                              key={pe.id ?? pe.extra?.id}
                              className="flex items-center gap-2"
                            >
                              <Package
                                size={9}
                                className="text-muted-foreground flex-shrink-0"
                              />
                              <p className="text-[10px] text-muted-foreground">
                                <span className="font-medium">
                                  {pe.quantity * item.quantity}×
                                </span>{" "}
                                {pe.extra?.name}
                                {pe.extra?.unit && (
                                  <span className="ml-1">
                                    ({pe.extra.unit})
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {c.orders.dialog.notes.value}
            </Label>
            <Input
              placeholder={c.orders.dialog.notesPlaceholder.value}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {c.orders.dialog.cancel.value}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !items.some((i) => i.productId)}
            >
              {loading
                ? c.orders.dialog.submitting.value
                : c.orders.dialog.submit.value}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── ManualEntryModal ────────────────────────────────────────────────────────
//
// Válvula de escape: abre quando o utilizador tenta concluir uma OP sem jobs.
//
// Lógica:
//   1. Lê a BOM de cada OrderItem → extrai requisitos de material por componente
//   2. Agrupa requisitos por (material + colorHex) para evitar duplicados
//   3. Para cada requisito, mostra um dropdown filtrado pelas bobines do inventário
//      que correspondem a esse material/cor
//   4. Ao submeter, cria um PrintJob retroativo via POST /api/production/jobs/manual

interface FilamentAssignment {
  // Identificador único do requisito (material+cor)
  reqKey: string;
  // Info do requisito (para display)
  material: string;
  colorHex: string | null;
  colorName: string | null;
  // Gramas estimadas (da BOM) — pré-preenchidas, editáveis
  estimatedG: number;
  // O que o utilizador seleccionou
  spoolId: string;
  actualG: number;
}

interface AvailableSpool {
  id: string;
  qrCodeId: string;
  currentWeight: number;
  initialWeight: number;
  priceCents: number;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
}

function ManualEntryModal({
  open,
  order,
  onConfirm,
  onClose,
}: {
  open: boolean;
  order: ProductionOrder;
  onConfirm: (data: {
    printerId: string;
    minutesPrinted: number;
    unitsProduced: number;
    assignments: { spoolId: string; actualG: number }[];
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [printers, setPrinters] = useState<
    { id: string; name: string; hourlyCost: number; powerWatts: number }[]
  >([]);
  const [allSpools, setAllSpools] = useState<AvailableSpool[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [printerId, setPrinterId] = useState("");
  const [minutesPrinted, setMinutesPrinted] = useState(0);
  const [unitsProduced, setUnitsProduced] = useState(
    order.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const [assignments, setAssignments] = useState<FilamentAssignment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ── Calcular requisitos de material da BOM ────────────────────────────────
  // Agrupa por (material + colorHex) somando os estimatedG
  const bomRequirements = (() => {
    const reqMap = new Map<string, FilamentAssignment>();
    for (const orderItem of order.items) {
      for (const bomEntry of orderItem.product.bom) {
        const profile = bomEntry.component.profiles[0];
        if (!profile) continue;
        for (const f of profile.filaments) {
          const key = `${f.material}::${f.colorHex ?? ""}`;
          const existing = reqMap.get(key);
          // Multiplicar pelo número de componentes na BOM × unidades do item
          const totalG = f.estimatedG * bomEntry.quantity * orderItem.quantity;
          if (existing) {
            existing.estimatedG += totalG;
          } else {
            reqMap.set(key, {
              reqKey: key,
              material: f.material,
              colorHex: f.colorHex,
              colorName: f.colorName,
              estimatedG: Math.round(totalG * 10) / 10,
              spoolId: "",
              actualG: Math.round(totalG * 10) / 10,
            });
          }
        }
      }
    }
    return Array.from(reqMap.values());
  })();

  // Inicializar assignments quando a BOM é calculada
  useEffect(() => {
    if (open && bomRequirements.length > 0 && assignments.length === 0) {
      setAssignments(bomRequirements);
    }
  }, [open]);

  // Carregar impressoras e bobines ao abrir (lazy)
  useEffect(() => {
    if (!open || dataLoaded) return;
    setLoadingData(true);
    Promise.all([
      fetch(`${SITE_URL}/api/printers`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      }).then((r) => r.json()),
      fetch(`${SITE_URL}/api/inventory`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      }).then((r) => r.json()),
    ])
      .then(([printersData, inventoryData]) => {
        if (Array.isArray(printersData)) setPrinters(printersData);
        if (Array.isArray(inventoryData)) setAllSpools(inventoryData);
        setDataLoaded(true);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [open, dataLoaded]);

  // Reset ao fechar
  function handleClose() {
    setAssignments([]);
    setDataLoaded(false);
    setPrinterId("");
    setMinutesPrinted(0);
    setUnitsProduced(order.items.reduce((sum, i) => sum + i.quantity, 0));
    onClose();
  }

  function updateAssignment(
    reqKey: string,
    patch: Partial<FilamentAssignment>,
  ) {
    setAssignments((prev) =>
      prev.map((a) => (a.reqKey === reqKey ? { ...a, ...patch } : a)),
    );
  }

  // Filtrar bobines para um requisito: corresponde ao material + cor aproximada
  function getCompatibleSpools(req: FilamentAssignment): AvailableSpool[] {
    return allSpools.filter((s) => {
      if (s.item.material.toLowerCase() !== req.material.toLowerCase())
        return false;
      if (!req.colorHex) return true;
      // Tolerância de cor RGB = 40
      const hex = (h: string) => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ];
      try {
        const [ar, ag, ab] = hex(s.item.colorHex);
        const [br, bg, bb] = hex(req.colorHex);
        return (
          Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2) <= 40
        );
      } catch {
        return true; // hex inválido → aceitar
      }
    });
  }

  // Validação: todos os requisitos têm bobine seleccionada + gramas > 0
  const allAssigned = assignments.every((a) => a.spoolId && a.actualG > 0);
  const isValid =
    printerId && minutesPrinted > 0 && allAssigned && unitsProduced > 0;

  // Estimativa de custos em tempo real
  const selectedPrinter = printers.find((p) => p.id === printerId);
  const hours = minutesPrinted / 60;
  const electricityCost = selectedPrinter
    ? (selectedPrinter.powerWatts / 1000) * hours * 0.2
    : 0;
  const printerCost = selectedPrinter ? selectedPrinter.hourlyCost * hours : 0;
  const filamentCost = assignments.reduce((sum, a) => {
    const spool = allSpools.find((s) => s.id === a.spoolId);
    if (!spool) return sum;
    return sum + (a.actualG * spool.priceCents) / 100 / spool.initialWeight;
  }, 0);
  const totalCost = electricityCost + printerCost + filamentCost;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onConfirm({
        printerId,
        minutesPrinted,
        unitsProduced,
        assignments: assignments.map((a) => ({
          spoolId: a.spoolId,
          actualG: a.actualG,
        })),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil size={15} className="text-warning flex-shrink-0" />
            Registo Manual de Produção
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Aviso */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            <p>
              Esta Ordem de Produção não tem registos de impressão. Para manter
              o teu inventário correto, indica os consumos reais abaixo.
            </p>
          </div>

          {/* Secção: Onde foi produzido */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              Onde foi produzido
            </p>

            {/* Impressora */}
            <div className="space-y-1.5">
              <Label className="text-xs">Impressora utilizada *</Label>
              {loadingData ? (
                <p className="text-xs text-muted-foreground">A carregar...</p>
              ) : (
                <select
                  value={printerId}
                  onChange={(e) => setPrinterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50 text-foreground"
                >
                  <option value="">Seleciona a impressora...</option>
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tempo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tempo de impressão *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="horas"
                    value={
                      minutesPrinted > 0 ? Math.floor(minutesPrinted / 60) : ""
                    }
                    onChange={(e) => {
                      const h = Number(e.target.value) || 0;
                      const m = minutesPrinted % 60;
                      setMinutesPrinted(h * 60 + m);
                    }}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="min"
                    value={minutesPrinted > 0 ? minutesPrinted % 60 : ""}
                    onChange={(e) => {
                      const m = Math.min(59, Number(e.target.value) || 0);
                      const h = Math.floor(minutesPrinted / 60);
                      setMinutesPrinted(h * 60 + m);
                    }}
                    className="text-sm"
                  />
                </div>
                {minutesPrinted > 0 && selectedPrinter && (
                  <p className="text-[10px] text-muted-foreground">
                    Soma {minutesPrinted}min ao contador de manutenção
                  </p>
                )}
              </div>

              {/* Unidades produzidas */}
              <div className="space-y-1.5">
                <Label className="text-xs">Unidades boas *</Label>
                <Input
                  type="number"
                  min="1"
                  max={order.items.reduce((s, i) => s + i.quantity, 0)}
                  value={unitsProduced}
                  onChange={(e) => setUnitsProduced(Number(e.target.value))}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Planeado: {order.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                  un.
                </p>
              </div>
            </div>
          </div>

          {/* Secção: Materiais consumidos */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              Materiais consumidos (BOM)
            </p>

            {assignments.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhum requisito de material encontrado na BOM. O sistema irá
                registar o job sem consumo de filamento.
              </p>
            )}

            {assignments.map((req) => {
              const compatibleSpools = getCompatibleSpools(req);
              const selectedSpool = allSpools.find((s) => s.id === req.spoolId);

              return (
                <div
                  key={req.reqKey}
                  className={cn(
                    "rounded-lg border p-3 space-y-2.5",
                    req.spoolId
                      ? "border-success/30 bg-success/5"
                      : "border-destructive/30 bg-destructive/5",
                  )}
                >
                  {/* Cabeçalho do requisito */}
                  <div className="flex items-center gap-2">
                    {req.colorHex && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-border/50"
                        style={{ backgroundColor: req.colorHex }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {req.material}
                        {req.colorName && (
                          <span className="font-normal text-muted-foreground ml-1">
                            {req.colorName}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Estimado pela BOM: {req.estimatedG}g
                      </p>
                    </div>
                    {req.spoolId ? (
                      <CheckCircle2
                        size={13}
                        className="text-success flex-shrink-0"
                      />
                    ) : (
                      <AlertTriangle
                        size={13}
                        className="text-destructive flex-shrink-0"
                      />
                    )}
                  </div>

                  {/* Selector de bobine */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">Bobine utilizada *</Label>
                    {loadingData ? (
                      <p className="text-xs text-muted-foreground">
                        A carregar bobines...
                      </p>
                    ) : compatibleSpools.length === 0 ? (
                      <p className="text-xs text-destructive">
                        Nenhuma bobine de {req.material}
                        {req.colorName ? ` ${req.colorName}` : ""} em stock.
                      </p>
                    ) : (
                      <select
                        value={req.spoolId}
                        onChange={(e) =>
                          updateAssignment(req.reqKey, {
                            spoolId: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:border-primary/50 text-foreground"
                      >
                        <option value="">Seleciona a bobine...</option>
                        {compatibleSpools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.item.brand} {s.item.material} {s.item.colorName}{" "}
                            — {s.currentWeight}g restantes · #
                            {s.qrCodeId.slice(-6)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Gramas reais */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">
                      Gramas reais consumidas *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={req.actualG || ""}
                        onChange={(e) =>
                          updateAssignment(req.reqKey, {
                            actualG: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-xs h-8"
                        placeholder={String(req.estimatedG)}
                      />
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        g
                      </span>
                    </div>
                    {selectedSpool && req.actualG > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Saldo após abate:{" "}
                        <span
                          className={cn(
                            "font-medium",
                            selectedSpool.currentWeight - req.actualG < 50
                              ? "text-warning"
                              : "text-foreground",
                          )}
                        >
                          {Math.max(
                            0,
                            selectedSpool.currentWeight - req.actualG,
                          ).toFixed(1)}
                          g
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo de custos estimados */}
          {printerId && minutesPrinted > 0 && (
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Estimativa de custos
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filamento</span>
                <span className="font-medium">€{filamentCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eletricidade</span>
                <span className="font-medium">
                  €{electricityCost.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impressora</span>
                <span className="font-medium">€{printerCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">
                  €{totalCost.toFixed(3)}
                </span>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
            >
              {submitting
                ? "A registar e concluir..."
                : "Registar e Concluir OP"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Print Job Card ───────────────────────────────────────────────────────────
// Shown inside an expanded OrderCard. Lets the user drive the job through
// its lifecycle: pending → printing → done (or failed).
// For multi-plate components, shows "Mesa N de N" so the user knows
// which plate they are currently printing.

function PrintJobCard({
  job,
  onChanged,
}: {
  job: ProductionOrder["printJobs"][0];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const jobCfg = JOB_STATUS_CONFIG[job.status] ?? JOB_STATUS_CONFIG.pending;

  // Multi-mesa: plateNumber e totalPlates podem existir no job
  const plateNumber = (job as any).plateNumber as number | null | undefined;
  const totalPlates = (job as any).totalPlates as number | null | undefined;
  const isMultiPlate = totalPlates && totalPlates > 1;

  async function transition(newStatus: "printing" | "done" | "failed") {
    setBusy(true);
    try {
      const res = await fetch(`${SITE_URL}/api/production/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar job");

      const labels: Record<string, string> = {
        printing: isMultiPlate
          ? `Mesa ${plateNumber} iniciada`
          : "Impressão iniciada",
        done: isMultiPlate
          ? `Mesa ${plateNumber} concluída ✓`
          : "Job concluído ✓",
        failed: "Job marcado como falhado",
      };
      toast({ title: labels[newStatus] });
      onChanged();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2.5",
        // Destaque visual para mesa activa em multi-placa
        isMultiPlate && job.status === "printing"
          ? "border-blue-500/40 bg-blue-500/5"
          : isMultiPlate && job.status === "done"
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-border",
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Indicador de mesa em componentes multi-placa */}
            {isMultiPlate && (
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                Mesa {plateNumber}/{totalPlates}
              </span>
            )}
            <p className="text-xs font-medium text-foreground truncate">
              {job.printer.name}
            </p>
            <Badge
              className={cn(
                "text-[9px] px-1.5 py-0 border flex-shrink-0",
                jobCfg.bg,
                jobCfg.color,
              )}
            >
              {jobCfg.label}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {job.notes
              ? job.notes
              : job.items
                  .map((i) => `${i.quantity}× ${i.component.name}`)
                  .join(", ")}
          </p>
        </div>
        {job.estimatedMinutes && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
            <Clock size={9} />
            {job.estimatedMinutes >= 60
              ? `${Math.floor(job.estimatedMinutes / 60)}h${job.estimatedMinutes % 60 > 0 ? `${job.estimatedMinutes % 60}m` : ""}`
              : `${job.estimatedMinutes}m`}
          </span>
        )}
      </div>

      {/* Action buttons — only for active jobs */}
      {job.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => transition("printing")}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-700 text-[11px] font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <PlayCircle size={11} />
            )}
            Confirmar início
          </button>
          <button
            onClick={() => transition("failed")}
            disabled={busy}
            className="px-3 py-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-[11px] hover:bg-destructive/20 transition-colors disabled:opacity-50"
            title="Cancelar / falhou antes de começar"
          >
            <StopCircle size={11} />
          </button>
        </div>
      )}

      {job.status === "printing" && (
        <div className="flex gap-2">
          <button
            onClick={() => transition("done")}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <CheckCircle2 size={11} />
            )}
            Marcar como concluído
          </button>
          <button
            onClick={() => transition("failed")}
            disabled={busy}
            className="px-3 py-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-[11px] hover:bg-destructive/20 transition-colors disabled:opacity-50"
            title="Marcar como falhado"
          >
            <StopCircle size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BOM Preview ─────────────────────────────────────────────────────────────
// Mostra a receita completa de um produto: componentes + extras.
// Calcula o progresso com base nos PrintJobItems concluídos.

function BomPreview({
  item,
  printJobs,
}: {
  item: OrderItem;
  printJobs: ProductionOrder["printJobs"];
}) {
  const bom = (item.product as any).bom ?? [];
  const extras = (item.product as any).extras ?? [];

  if (bom.length === 0 && extras.length === 0) return null;

  // Para cada componente da BOM, encontrar os jobs que o produziram
  function getComponentJobs(componentId: string) {
    return printJobs.filter((j) =>
      j.items.some(
        (ji: any) =>
          ji.component?.id === componentId || ji.componentId === componentId,
      ),
    );
  }

  return (
    <div className="space-y-1.5 mt-2 pl-2 border-l-2 border-border/60">
      {/* Componentes impressos */}
      {bom.map((entry: any) => {
        const component = entry.component;
        const needed = entry.quantity * item.quantity;
        const componentJobs = getComponentJobs(component.id);
        const produced = componentJobs
          .filter((j) => j.status === "done")
          .reduce((sum: number, j) => sum + j.quantity, 0);
        const hasActiveJob = componentJobs.some((j) =>
          ["pending", "printing"].includes(j.status),
        );
        const isDone = produced >= needed;
        const profile = component.profiles?.[0];

        return (
          <div
            key={entry.id ?? component.id}
            className="flex items-start gap-2"
          >
            {isDone ? (
              <CheckCircle2
                size={11}
                className="text-emerald-500 flex-shrink-0 mt-0.5"
              />
            ) : hasActiveJob ? (
              <Loader2
                size={11}
                className="text-blue-500 flex-shrink-0 mt-0.5 animate-spin"
              />
            ) : (
              <Circle
                size={11}
                className="text-muted-foreground/40 flex-shrink-0 mt-0.5"
              />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[11px] leading-tight",
                  isDone
                    ? "text-emerald-600"
                    : hasActiveJob
                      ? "text-blue-600"
                      : "text-muted-foreground",
                )}
              >
                <span className="font-medium">{needed}×</span> {component.name}
              </p>
              {profile?.filaments?.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {profile.filaments.slice(0, 4).map((f: any, i: number) => (
                    <span key={i} className="flex items-center gap-0.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: f.colorHex ?? "#888" }}
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {f.material}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {produced > 0 && !isDone && (
              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                {produced}/{needed}
              </span>
            )}
          </div>
        );
      })}

      {/* Extras (hardware) */}
      {extras.length > 0 && (
        <>
          <div className="flex items-center gap-1 pt-1">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider px-1">
              extras
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          {extras.map((pe: any) => (
            <div
              key={pe.id ?? pe.extra?.id}
              className="flex items-center gap-2"
            >
              <Package
                size={10}
                className="text-muted-foreground/50 flex-shrink-0"
              />
              <span className="text-[11px] text-muted-foreground">
                <span className="font-medium">
                  {pe.quantity * item.quantity}×
                </span>{" "}
                {pe.extra?.name ?? "Extra"}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Assembly Checklist ───────────────────────────────────────────────────────
// Mostrada quando a OP está em "assembly".
// Permite ao utilizador confirmar que recolheu os extras do stock.

function AssemblyChecklist({ order }: { order: ProductionOrder }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const allExtras = (order.items ?? []).flatMap((item) => {
    const extras = (item.product as any).extras ?? [];
    return extras.map((pe: any) => ({
      key: `${item.id}-${pe.extra?.id ?? pe.id}`,
      name: pe.extra?.name ?? "Extra",
      quantity: pe.quantity * item.quantity,
      unit: pe.extra?.unit,
    }));
  });

  if (allExtras.length === 0) return null;

  const allChecked = allExtras.every((e) => checked.has(e.key));

  return (
    <div className="border-t border-purple-500/20 bg-purple-500/5 px-4 py-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
        <Hammer size={11} />
        Checklist de Montagem
      </p>
      <div className="space-y-1.5">
        {allExtras.map((extra) => (
          <button
            key={extra.key}
            type="button"
            onClick={() =>
              setChecked((prev) => {
                const next = new Set(prev);
                next.has(extra.key)
                  ? next.delete(extra.key)
                  : next.add(extra.key);
                return next;
              })
            }
            className={cn(
              "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg border text-left transition-colors",
              checked.has(extra.key)
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-border bg-background/40 hover:bg-muted/40",
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                checked.has(extra.key)
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-border",
              )}
            >
              {checked.has(extra.key) && (
                <CheckCircle2 size={10} className="text-white" />
              )}
            </div>
            <span
              className={cn(
                "text-xs flex-1",
                checked.has(extra.key)
                  ? "line-through text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {extra.quantity}× {extra.name}
              {extra.unit && (
                <span className="text-muted-foreground ml-1">
                  ({extra.unit})
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      {allChecked && (
        <p className="text-[10px] text-emerald-600 flex items-center gap-1">
          <CheckCircle2 size={10} />
          Todos os extras confirmados — podes concluir a OP.
        </p>
      )}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onRefresh,
}: {
  order: ProductionOrder;
  onRefresh: () => void;
}) {
  const c = useIntlayer("production");
  const hasActiveJobs = order.printJobs.some((j) =>
    ["pending", "printing"].includes(j.status),
  );
  const [expanded, setExpanded] = useState(hasActiveJobs);
  const [completing, setCompleting] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.draft;
  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  const { totalG } = calcNeeds(order.items ?? []);

  const isLinkedToSale = !!(order as any).salesOrderId;
  const hasPendingJobs = hasActiveJobs;
  const hasDoneJobs = order.printJobs.some((j) => j.status === "done");
  const isAdHoc = (order.items ?? []).length === 0;
  const canComplete =
    (order.status === "assembly" || order.status === "in_progress") &&
    !hasPendingJobs;

  const showTransitions = transitions.filter((s) =>
    canComplete && order.status === "in_progress" ? s !== "assembly" : true,
  );

  // Progresso global da OP: componentes prontos / total necessário
  const componentProgress = (() => {
    const allComponents: { id: string; needed: number }[] = [];
    for (const item of order.items ?? []) {
      for (const entry of (item.product as any).bom ?? []) {
        allComponents.push({
          id: entry.component.id,
          needed: entry.quantity * item.quantity,
        });
      }
    }
    if (allComponents.length === 0) return null;

    const totalNeeded = allComponents.reduce((s, c) => s + c.needed, 0);
    const totalDone = allComponents.reduce((s, comp) => {
      const produced = order.printJobs
        .filter(
          (j) =>
            j.status === "done" &&
            j.items.some(
              (ji: any) =>
                ji.component?.id === comp.id || ji.componentId === comp.id,
            ),
        )
        .reduce((sum, j) => sum + j.quantity, 0);
      return s + Math.min(produced, comp.needed);
    }, 0);

    return {
      done: totalDone,
      total: totalNeeded,
      pct: Math.round((totalDone / totalNeeded) * 100),
    };
  })();

  async function handleStatusChange(newStatus: string) {
    if (newStatus === "in_progress") {
      toast({
        title: "Usa o Planeador de Mesas",
        description: PLANNER_REQUIRED_MSG,
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.orders.toast.updated.value });
      onRefresh();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    }
  }

  async function handleComplete() {
    if (hasPendingJobs) {
      toast({
        title: "Existem print jobs ainda em curso",
        description: "Conclui todos os print jobs antes de fechar a OP.",
        variant: "destructive",
      });
      return;
    }
    if (!hasDoneJobs) {
      setManualEntryOpen(true);
      return;
    }
    if (
      !confirm(
        `Concluir a OP ${order.reference}?\n\nEsta ação irá:\n• Abater filamento e extras do inventário\n• Creditar unidades no stock de produto acabado\n• Atualizar a venda vinculada (se aplicável)`,
      )
    )
      return;
    await doComplete();
  }

  async function doComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ action: "complete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const itemsSummary = (data.itemsCompleted ?? [])
        .map(
          (i: any) =>
            `${i.quantityProduced}× ${i.productName} → stock: ${i.stockAfter}`,
        )
        .join("\n");
      const salesMsg = data.salesOrder
        ? `\nVenda marcada como "Pronta a Enviar" (${data.salesOrder.unitsReserved} un. reservadas)`
        : "";
      toast({
        title: `✓ OP ${data.reference} concluída`,
        description: itemsSummary + salesMsg || undefined,
      });
      onRefresh();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  }

  async function handleManualEntry(data: {
    printerId: string;
    minutesPrinted: number;
    unitsProduced: number;
    assignments: { spoolId: string; actualG: number }[];
  }) {
    try {
      const jobRes = await fetch(`${SITE_URL}/api/production/jobs/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          orderId: order.id,
          printerId: data.printerId,
          minutesPrinted: data.minutesPrinted,
          unitsProduced: data.unitsProduced,
          assignments: data.assignments,
        }),
      });
      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error);
      setManualEntryOpen(false);
      toast({ title: "Consumo registado — a concluir OP..." });
      await doComplete();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!confirm(c.orders.toast.confirmDelete.value)) return;
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders/${order.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.orders.toast.deleted.value });
      onRefresh();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-colors",
        isLinkedToSale ? "border-primary/30" : "border-border",
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground font-mono">
              #{order.reference}
            </span>
            <Badge
              className={cn(
                "text-[10px] px-2 py-0 border",
                status.bg,
                status.color,
              )}
            >
              {status.label}
            </Badge>
            {isLinkedToSale && (
              <Badge className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                <Link2 size={8} />
                Encomenda cliente
              </Badge>
            )}
            {/* Destino badge */}
            {(order as any).origin === "manual" ||
            !(order as any).salesOrderId ? (
              <Badge className="text-[10px] px-2 py-0 bg-muted/60 text-muted-foreground border-border">
                Para stock
              </Badge>
            ) : null}
          </div>

          {/* Produtos com BOM inline */}
          <div className="mt-2 space-y-2">
            {(order.items ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <PlayCircle size={10} className="text-blue-500 flex-shrink-0" />
                Impressão direta — sem produto associado
              </p>
            ) : (
              (order.items ?? []).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center gap-1.5">
                    <Box
                      size={11}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <p className="text-xs font-medium text-foreground">
                      {item.quantity}× {item.product.name}
                      {item.completed > 0 && (
                        <span className="text-emerald-600 font-normal ml-1.5">
                          ({item.completed} prontos)
                        </span>
                      )}
                    </p>
                  </div>
                  <BomPreview item={item} printJobs={order.printJobs} />
                </div>
              ))
            )}
          </div>

          {/* Progresso global + filamento */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {componentProgress && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      componentProgress.pct === 100
                        ? "bg-emerald-500"
                        : "bg-primary",
                    )}
                    style={{ width: `${componentProgress.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {componentProgress.done}/{componentProgress.total} componentes
                </span>
              </div>
            )}
            {totalG > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers size={9} />
                {totalG >= 1000
                  ? `${(totalG / 1000).toFixed(2)}kg`
                  : `${Math.round(totalG)}g`}{" "}
                filamento
              </span>
            )}
          </div>
        </div>

        {/* Ações header */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(order.createdAt), "dd/MM/yy")}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground"
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Checklist de montagem — só em assembly */}
      {order.status === "assembly" && <AssemblyChecklist order={order} />}

      {/* Concluir OP */}
      {canComplete && (
        <div className="px-4 pb-3 space-y-1.5">
          <button
            onClick={handleComplete}
            disabled={completing}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              hasDoneJobs
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",
              completing && "opacity-60 cursor-not-allowed",
            )}
          >
            {hasDoneJobs ? <CheckCircle2 size={14} /> : <Pencil size={14} />}
            {completing
              ? "A concluir..."
              : hasDoneJobs
                ? "Concluir OP — Creditar Stock"
                : "Concluir OP — Registo Manual"}
          </button>
          {!hasDoneJobs && (
            <p className="text-[10px] text-warning/80 text-center flex items-center justify-center gap-1">
              <AlertTriangle size={9} />
              Sem jobs de impressão registados — será pedido o consumo manual.
            </p>
          )}
        </div>
      )}

      <ManualEntryModal
        open={manualEntryOpen}
        order={order}
        onConfirm={handleManualEntry}
        onClose={() => setManualEntryOpen(false)}
      />

      {/* Transições de estado */}
      {showTransitions.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap items-center">
          {showTransitions.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium",
                  cfg.bg,
                  cfg.color,
                  "hover:opacity-80",
                )}
              >
                → {cfg.label}
              </button>
            );
          })}
          {(order.status === "pending" ||
            (order.status === "in_progress" && hasPendingJobs)) && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-1">
              <Info size={9} />
              {order.status === "pending"
                ? "Usa o Planeador para iniciar a impressão"
                : "Conclui os jobs abaixo para poder fechar a OP"}
            </span>
          )}
        </div>
      )}

      {/* Expandido: Print Jobs agrupados por produto */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {order.printJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center">
              Sem print jobs lançados. Usa o{" "}
              <span className="font-medium">Planeador</span> para atribuir esta
              OP a uma impressora.
            </p>
          ) : (
            <>
              {/* Agrupar jobs por produto/componente */}
              {(order.items ?? []).length > 0 ? (
                (order.items ?? []).map((item) => {
                  const itemJobs = order.printJobs.filter((j) =>
                    j.items.some((ji: any) =>
                      (item.product as any).bom?.some(
                        (b: any) =>
                          b.component.id ===
                          (ji.component?.id ?? ji.componentId),
                      ),
                    ),
                  );
                  const unrelatedJobs = order.printJobs.filter(
                    (j) => !itemJobs.includes(j),
                  );
                  return (
                    <div key={item.id} className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Box size={10} />
                        {item.product.name}
                      </p>
                      {itemJobs.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic pl-4">
                          Nenhum job lançado ainda para este produto.
                        </p>
                      ) : (
                        itemJobs.map((job) => (
                          <PrintJobCard
                            key={job.id}
                            job={job}
                            onChanged={onRefresh}
                          />
                        ))
                      )}
                    </div>
                  );
                })
              ) : (
                // OP ad-hoc: mostrar jobs directamente
                <div className="space-y-2">
                  {order.printJobs.map((job) => (
                    <PrintJobCard
                      key={job.id}
                      job={job}
                      onChanged={onRefresh}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── OrdersTab ────────────────────────────────────────────────────────────────

export function OrdersTab({
  orders,
  products,
  onRefresh,
}: {
  orders: ProductionOrder[];
  products: Product[];
  onRefresh: () => void;
}) {
  const c = useIntlayer("production");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.reference.toLowerCase().includes(q) ||
      (o.items ?? []).some((i) => i.product.name.toLowerCase().includes(q));
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder={c.orders.searchPlaceholder.value}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-sm w-44"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="">{c.orders.allStatuses.value}</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          {c.orders.addButton.value}
        </Button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <ClipboardList
            size={32}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-muted-foreground">
            {c.orders.empty.title.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            {c.orders.empty.description.value}
          </p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            {c.orders.addButton.value}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      <NewOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        onCreated={onRefresh}
      />
    </div>
  );
}
