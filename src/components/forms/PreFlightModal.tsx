"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Zap,
  Clock,
  PlayCircle,
  PackageSearch,
  Pencil,
  Plus,
  Minus,
  Loader2,
  Info,
  Wrench,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import type {
  MatchResult,
  MaterialMatch,
  SlotCandidate,
} from "@/lib/preflight/matcher";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrintProfile {
  id: string;
  name: string;
  printTime: number | null;
  filamentUsed: number | null;
}

interface Product {
  id: string;
  name: string;
  // A API pode devolver "printProfiles" (legado) ou perfis via BOM
  printProfiles?: PrintProfile[];
  // Perfis agregados de todos os componentes da BOM
  bom?: {
    component: {
      profiles: PrintProfile[];
    };
  }[];
}

// Helper: obter todos os perfis de um produto (seja qual for a estrutura da API)
function getProductProfiles(p: Product): PrintProfile[] {
  if (p.printProfiles && p.printProfiles.length > 0) return p.printProfiles;
  // Agregar perfis de todos os componentes da BOM
  return p.bom?.flatMap((entry) => entry.component?.profiles ?? []) ?? [];
}

interface PreFlightModalProps {
  printerId: string;
  printerName: string;
  onClose: () => void;
  // Chamado após dispatch bem-sucedido com os dados da OP criada
  onDispatched: (result: {
    jobId: string;
    orderId: string;
    orderReference: string;
  }) => void;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Selecionar", "Verificar", "Confirmar"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 ${active ? "text-primary" : done ? "text-muted-foreground" : "text-muted-foreground/40"}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${active ? "bg-primary text-primary-foreground border-primary" : done ? "bg-muted border-border" : "border-border"}`}
              >
                {done ? <CheckCircle2 size={12} /> : n}
              </div>
              <span className="text-xs hidden sm:block">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Material row ─────────────────────────────────────────────────────────────
//
// Mostra sempre a lista de candidatos em linha para o utilizador poder
// escolher explicitamente qual slot usar para cada requisito de material.
// O candidato atribuído fica destacado; os restantes ficam como opção.

function MaterialRow({
  match,
  onAssign,
  conflictSlotIds = new Set(),
}: {
  match: MaterialMatch;
  onAssign: (candidate: SlotCandidate | null) => void;
  conflictSlotIds?: Set<string>;
}) {
  const req = match.required;
  const assigned = match.assigned;

  const hasConflict = assigned !== null && conflictSlotIds.has(assigned.slotId);

  const effectiveStatus = hasConflict ? "missing" : match.status;

  const statusIcon = {
    ok: <CheckCircle2 size={14} className="text-emerald-500" />,
    partial: <AlertTriangle size={14} className="text-amber-500" />,
    missing: <XCircle size={14} className="text-destructive" />,
    insufficient_weight: (
      <AlertTriangle size={14} className="text-destructive" />
    ),
  }[effectiveStatus];

  const statusColor = {
    ok: "border-emerald-500/30 bg-emerald-500/5",
    partial: "border-amber-500/30 bg-amber-500/5",
    missing: "border-destructive/30 bg-destructive/5",
    insufficient_weight: "border-destructive/30 bg-destructive/5",
  }[effectiveStatus];

  return (
    <div className={`rounded-lg border ${statusColor} overflow-hidden`}>
      {/* Cabeçalho: requisito */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {statusIcon}
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 border border-white/20"
          style={{ backgroundColor: req.colorHex ?? "#888" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {req.material}
            {req.colorName && (
              <span className="text-muted-foreground font-normal">
                {" "}
                · {req.colorName}
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {req.estimatedG}g estimados
          </p>
        </div>
        {hasConflict && (
          <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 flex-shrink-0">
            slot duplicado
          </Badge>
        )}
        {assigned?.warning?.includes("adaptador") && !hasConflict && (
          <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
            <Wrench size={9} className="mr-0.5" />
            adaptador
          </Badge>
        )}
      </div>

      {/* Aviso de warning do slot */}
      {assigned?.warning && !hasConflict && (
        <div className="px-3 pb-1.5 flex items-start gap-1.5">
          <AlertTriangle
            size={11}
            className="text-amber-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-amber-600">{assigned.warning}</p>
        </div>
      )}

      {/* Aviso de conflito */}
      {hasConflict && (
        <div className="px-3 pb-1.5 flex items-start gap-1.5">
          <AlertTriangle
            size={11}
            className="text-destructive flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-destructive">
            Este slot está atribuído a outro requisito. Escolhe um diferente
            abaixo.
          </p>
        </div>
      )}

      {/* Seletor de slot — sempre visível */}
      <div className="border-t border-border/40 divide-y divide-border/20">
        {match.candidates.length === 0 ? (
          <p className="px-3 py-2 text-[10px] text-muted-foreground italic">
            Nenhum slot com este material carregado.
          </p>
        ) : (
          match.candidates.map((c) => {
            const isSelected = assigned?.slotId === c.slotId;
            const isConflicted = !isSelected && conflictSlotIds.has(c.slotId);
            return (
              <button
                key={c.slotId}
                type="button"
                onClick={() => onAssign(isSelected ? null : c)}
                className={[
                  "flex items-center gap-3 w-full px-3 py-2.5 transition-colors text-left",
                  isSelected
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : isConflicted
                      ? "opacity-50 hover:bg-muted/30"
                      : "hover:bg-muted/40",
                ].join(" ")}
              >
                {/* Indicador de seleção */}
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

                {/* Cor do spool */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: c.itemColorHex }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    {c.unitName} · P{c.position}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {c.itemBrand} {c.itemMaterial} {c.itemColorName} ·{" "}
                    {c.spoolCurrentWeight}g
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isConflicted && (
                    <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                      em uso
                    </Badge>
                  )}
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    ✓
                  </Badge>
                  {!c.hasSufficientWeight && (
                    <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                      peso ⚠
                    </Badge>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function PreFlightModal({
  printerId,
  printerName,
  onClose,
  onDispatched,
}: PreFlightModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — seleção
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<{
    id: string;
    name: string;
    printTime: number | null;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [manualMode, setManualMode] = useState(false);
  const [manualMaterials, setManualMaterials] = useState<
    {
      material: string;
      colorHex: string;
      colorName: string;
      estimatedG: number;
    }[]
  >([{ material: "", colorHex: "#000000", colorName: "", estimatedG: 0 }]);

  // Pesquisa de produto no Step 1
  const [productSearch, setProductSearch] = useState("");

  // Step 2 — verificação
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [materials, setMaterials] = useState<MaterialMatch[]>([]);

  // Modo de cor fixo em "ignore" — a associação slot→material é por material base,
  // a cor é escolhida pelo utilizador no Step 2.
  const colorMode = "ignore" as const;

  // Step 3 — confirmação
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{
    jobId: string;
    orderId: string;
    orderReference: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/products?withProfiles=1", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, []);

  // ── Step 1 → 2: Analisar materiais ───────────────────────────────────────
  async function handleAnalyze() {
    setLoading(true);
    try {
      const body = manualMode
        ? {
            materials: manualMaterials.filter(
              (m) => m.material && m.estimatedG > 0,
            ),
            quantity,
            productId: selectedProduct?.id,
            estimatedMinutes: selectedProfile?.printTime,
            colorMode,
          }
        : {
            profileId: selectedProfile?.id,
            productId: selectedProduct?.id,
            quantity,
            estimatedMinutes: selectedProfile?.printTime,
            colorMode,
          };

      const res = await fetch(
        `${SITE_URL}/api/printers/${printerId}/preflight/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.source === "manual_required") {
        setManualMode(true);
        toast({ title: data.message });
        return;
      }

      setMatchResult(data.matchResult);
      setMaterials(data.matchResult.materials);
      setStep(2);
    } catch (e: any) {
      toast({
        title: "Erro na análise",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 → 3: Confirmar e despachar ────────────────────────────────────
  async function handleDispatch() {
    setLoading(true);
    try {
      const assignedMaterials = materials.map((m) => ({
        material: m.required.material,
        colorHex: m.required.colorHex,
        colorName: m.required.colorName,
        estimatedG: m.required.estimatedG,
        slotId: m.assigned?.slotId ?? null,
        spoolId: m.assigned?.spoolId ?? null,
        matchScore: m.assigned?.score ?? 0,
      }));

      const res = await fetch(
        `${SITE_URL}/api/printers/${printerId}/preflight/dispatch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify({
            productId: selectedProduct?.id ?? null,
            profileId: selectedProfile?.id ?? null,
            quantity,
            estimatedMinutes: selectedProfile?.printTime ?? null,
            materials: assignedMaterials,
          }),
        },
      );
      const data = await res.json();
      console.log("[PreFlightModal] dispatch response:", data);
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setApiMessage(data.apiMessage ?? null);
      setDispatchResult({
        jobId: data.jobId,
        orderId: data.orderId,
        orderReference: data.orderReference,
      });
      setStep(3);
    } catch (e: any) {
      console.error("[PreFlightModal] dispatch error:", e);
      toast({
        title: "Erro ao iniciar impressão",
        description: e.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const canProceedStep1 = manualMode
    ? manualMaterials.some((m) => m.material && m.estimatedG > 0)
    : selectedProfile !== null;

  const canProceedStep2 = (() => {
    // Todos os materiais têm de ter um spool atribuído — sem exceções
    if (!materials.every((m) => m.assigned !== null)) return false;
    // Não pode haver slots duplicados (mesmo slot para dois requisitos)
    const slotIds = materials.map((m) => m.assigned!.slotId);
    return slotIds.length === new Set(slotIds).size;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{printerName}</p>
            <h2 className="text-sm font-semibold text-foreground mt-0.5">
              Preparar Impressão
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Steps current={step} />
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ── Step 1: Selecionar ── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Produto */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Produto (opcional)
                </Label>
                {loadingProducts ? (
                  <p className="text-xs text-muted-foreground">A carregar…</p>
                ) : (
                  <div className="space-y-1.5">
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
                    {/* Lista filtrada */}
                    <div className="max-h-40 overflow-y-auto space-y-0.5 border border-border rounded-lg p-1.5">
                      {products.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Sem produtos criados.
                        </p>
                      )}
                      {products
                        .filter((p) =>
                          p.name
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        )
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(
                                p === selectedProduct ? null : p,
                              );
                              setSelectedProfile(null);
                              setProductSearch("");
                            }}
                            className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${selectedProduct?.id === p.id ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-foreground"}`}
                          >
                            <span>{p.name}</span>
                            {getProductProfiles(p).length > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {getProductProfiles(p).length} perfis
                              </Badge>
                            )}
                          </button>
                        ))}
                      {products.length > 0 &&
                        products.filter((p) =>
                          p.name
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            Sem resultados para "{productSearch}"
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Perfil de impressão */}
              {selectedProduct &&
                getProductProfiles(selectedProduct).length > 0 &&
                !manualMode && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Perfil de Impressão
                    </Label>
                    <div className="space-y-1.5">
                      {getProductProfiles(selectedProduct).map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => setSelectedProfile(profile)}
                          className={`flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors ${selectedProfile?.id === profile.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                        >
                          <span className="text-sm font-medium text-foreground">
                            {profile.name}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {profile.printTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {Math.round(profile.printTime / 60)}h
                              </span>
                            )}
                            {profile.filamentUsed && (
                              <span className="flex items-center gap-1">
                                <Layers size={11} />
                                {profile.filamentUsed}g
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Modo manual */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => setManualMode((v) => !v)}
                  className="text-[10px] text-muted-foreground hover:text-primary uppercase flex items-center gap-1"
                >
                  <Pencil size={9} />
                  {manualMode
                    ? "Usar perfil .3mf"
                    : "Inserir materiais manualmente"}
                </button>
                <div className="flex-1 h-px bg-border" />
              </div>

              {manualMode && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Materiais Necessários
                  </Label>
                  {manualMaterials.map((m, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4 space-y-1">
                        {i === 0 && (
                          <Label className="text-[10px] text-muted-foreground">
                            Material
                          </Label>
                        )}
                        <Input
                          placeholder="PLA"
                          value={m.material}
                          onChange={(e) => {
                            const updated = [...manualMaterials];
                            updated[i] = {
                              ...updated[i],
                              material: e.target.value,
                            };
                            setManualMaterials(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        {i === 0 && (
                          <Label className="text-[10px] text-muted-foreground">
                            Cor
                          </Label>
                        )}
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={m.colorHex}
                            onChange={(e) => {
                              const updated = [...manualMaterials];
                              updated[i] = {
                                ...updated[i],
                                colorHex: e.target.value,
                              };
                              setManualMaterials(updated);
                            }}
                            className="w-8 h-8 rounded border border-border cursor-pointer"
                          />
                          <Input
                            placeholder="Preto"
                            value={m.colorName}
                            onChange={(e) => {
                              const updated = [...manualMaterials];
                              updated[i] = {
                                ...updated[i],
                                colorName: e.target.value,
                              };
                              setManualMaterials(updated);
                            }}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      </div>
                      <div className="col-span-3 space-y-1">
                        {i === 0 && (
                          <Label className="text-[10px] text-muted-foreground">
                            Gramas
                          </Label>
                        )}
                        <Input
                          type="number"
                          placeholder="50"
                          value={m.estimatedG || ""}
                          onChange={(e) => {
                            const updated = [...manualMaterials];
                            updated[i] = {
                              ...updated[i],
                              estimatedG: Number(e.target.value),
                            };
                            setManualMaterials(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2 flex gap-1 justify-end">
                        {manualMaterials.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setManualMaterials((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="h-8 w-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"
                          >
                            <Minus size={12} />
                          </button>
                        )}
                        {i === manualMaterials.length - 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setManualMaterials((prev) => [
                                ...prev,
                                {
                                  material: "",
                                  colorHex: "#000000",
                                  colorName: "",
                                  estimatedG: 0,
                                },
                              ])
                            }
                            className="h-8 w-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantidade */}
              <div className="flex items-center gap-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quantidade
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Verificar slots ── */}
          {step === 2 && matchResult && (
            <div className="space-y-3">
              {/* Resumo */}
              <div
                className={`flex items-start gap-2 p-3 rounded-lg border ${matchResult.canProceed ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}
              >
                {matchResult.canProceed ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <XCircle
                    size={14}
                    className="text-destructive mt-0.5 flex-shrink-0"
                  />
                )}
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {matchResult.canProceed
                      ? "Tudo pronto para imprimir"
                      : "Alguns materiais precisam de atenção"}
                  </p>
                  {matchResult.warnings.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {matchResult.warnings.map((w, i) => (
                        <li
                          key={i}
                          className="text-[10px] text-muted-foreground"
                        >
                          {w}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Lista de materiais */}
              {(() => {
                // Calcular quais slotIds estão duplicados (atribuídos a mais de 1 requisito)
                const slotCounts = new Map<string, number>();
                for (const m of materials) {
                  if (m.assigned?.slotId) {
                    slotCounts.set(
                      m.assigned.slotId,
                      (slotCounts.get(m.assigned.slotId) ?? 0) + 1,
                    );
                  }
                }
                const conflictSlotIds = new Set(
                  [...slotCounts.entries()]
                    .filter(([, count]) => count > 1)
                    .map(([slotId]) => slotId),
                );
                return (
                  <div className="space-y-2">
                    {materials.map((m, i) => (
                      <MaterialRow
                        key={i}
                        match={m}
                        conflictSlotIds={conflictSlotIds}
                        onAssign={(candidate) => {
                          setMaterials((prev) =>
                            prev.map((mat, j) =>
                              j === i
                                ? {
                                    ...mat,
                                    assigned: candidate,
                                    status: candidate
                                      ? candidate.score === 100
                                        ? "ok"
                                        : "partial"
                                      : "missing",
                                  }
                                : mat,
                            ),
                          );
                        }}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Step 3: Confirmação ── */}
          {step === 3 && (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Impressão Iniciada!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {printerName} passou para estado "A Imprimir".
                </p>
              </div>
              {dispatchResult && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-left">
                  <Info
                    size={13}
                    className="text-primary mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      OP criada:{" "}
                      <span className="font-mono">
                        {dispatchResult.orderReference}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Podes acompanhar e concluir a impressão na página de
                      Produção.
                    </p>
                  </div>
                </div>
              )}
              {apiMessage && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border text-left">
                  <Info
                    size={13}
                    className="text-muted-foreground mt-0.5 flex-shrink-0"
                  />
                  <p className="text-xs text-foreground">{apiMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={
              step === 1 ? onClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)
            }
            disabled={loading || step === 3}
          >
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step === 1 && (
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={loading || !canProceedStep1}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              Verificar Slots
            </Button>
          )}

          {step === 2 && (
            <Button
              size="sm"
              onClick={handleDispatch}
              disabled={loading || !canProceedStep2}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PlayCircle size={14} />
              )}
              {canProceedStep2
                ? "Confirmar e Iniciar"
                : "Atribui todos os slots"}
            </Button>
          )}

          {step === 3 && (
            <Button
              size="sm"
              onClick={() => {
                if (dispatchResult) onDispatched(dispatchResult);
                onClose();
              }}
              className="gap-1.5"
            >
              <CheckCircle2 size={14} />
              Fechar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
