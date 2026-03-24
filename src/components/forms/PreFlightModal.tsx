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
  onDispatched: () => void;
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

function MaterialRow({
  match,
  onAssign,
}: {
  match: MaterialMatch;
  onAssign: (candidate: SlotCandidate | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const req = match.required;
  const assigned = match.assigned;

  const statusIcon = {
    ok: <CheckCircle2 size={14} className="text-emerald-500" />,
    partial: <AlertTriangle size={14} className="text-amber-500" />,
    missing: <XCircle size={14} className="text-destructive" />,
    insufficient_weight: (
      <AlertTriangle size={14} className="text-destructive" />
    ),
  }[match.status];

  const statusColor = {
    ok: "border-emerald-500/30 bg-emerald-500/5",
    partial: "border-amber-500/30 bg-amber-500/5",
    missing: "border-destructive/30 bg-destructive/5",
    insufficient_weight: "border-destructive/30 bg-destructive/5",
  }[match.status];

  return (
    <div className={`rounded-lg border ${statusColor} overflow-hidden`}>
      {/* Row header */}
      <div className="flex items-center gap-3 p-3">
        {statusIcon}

        {/* Cor do material */}
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 border border-white/20"
          style={{ backgroundColor: req.colorHex ?? "#888" }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
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

        {/* Slot atribuído */}
        {assigned ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: assigned.itemColorHex }}
            />
            <span className="text-xs text-foreground">
              {assigned.unitName} · P{assigned.position}
            </span>
            {assigned.score === 50 && (
              <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                cor ≠
              </Badge>
            )}
            {!assigned.hasSufficientWeight && (
              <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                peso ⚠
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-destructive flex-shrink-0">
            Não encontrado
          </span>
        )}

        {/* Aviso adaptador */}
        {assigned?.warning?.includes("adaptador") && (
          <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
            <Wrench size={9} className="mr-0.5" />
            adaptador
          </Badge>
        )}

        {/* Toggle expandir candidatos */}
        {match.candidates.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Aviso expandido */}
      {assigned?.warning && (
        <div className="px-3 pb-2 flex items-start gap-1.5">
          <AlertTriangle
            size={11}
            className="text-amber-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-amber-600">{assigned.warning}</p>
        </div>
      )}

      {/* Lista de candidatos */}
      {expanded && (
        <div className="border-t border-border/50 divide-y divide-border/30">
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Trocar para:
            </p>
          </div>
          {match.candidates.map((c) => (
            <button
              key={c.slotId}
              type="button"
              onClick={() => {
                onAssign(c);
                setExpanded(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/40 transition-colors text-left ${assigned?.slotId === c.slotId ? "bg-primary/5" : ""}`}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.itemColorHex }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  {c.unitName} · Posição {c.position}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {c.itemBrand} {c.itemMaterial} {c.itemColorName} ·{" "}
                  {c.spoolCurrentWeight}g
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {c.score === 100 ? (
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    perfeito
                  </Badge>
                ) : (
                  <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                    cor ≠
                  </Badge>
                )}
                {!c.hasSufficientWeight && (
                  <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                    peso ⚠
                  </Badge>
                )}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onAssign(null);
              setExpanded(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/40 transition-colors text-left"
          >
            <XCircle size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Deixar sem atribuir
            </span>
          </button>
        </div>
      )}
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

  // Step 2 — verificação
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [materials, setMaterials] = useState<MaterialMatch[]>([]);

  // Step 3 — confirmação
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products?withProfiles=1")
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
          }
        : {
            profileId: selectedProfile?.id,
            productId: selectedProduct?.id,
            quantity,
            estimatedMinutes: selectedProfile?.printTime,
          };

      const res = await fetch(`/api/printers/${printerId}/preflight/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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

      const res = await fetch(`/api/printers/${printerId}/preflight/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct?.id ?? null,
          profileId: selectedProfile?.id ?? null,
          quantity,
          estimatedMinutes: selectedProfile?.printTime ?? null,
          materials: assignedMaterials,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setApiMessage(data.apiMessage);
      setStep(3);
    } catch (e: any) {
      toast({
        title: "Erro ao iniciar impressão",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const canProceedStep1 = manualMode
    ? manualMaterials.some((m) => m.material && m.estimatedG > 0)
    : selectedProfile !== null;

  const canProceedStep2 = materials.every((m) => m.status !== "missing");

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
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {products.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Sem produtos criados.
                      </p>
                    )}
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p === selectedProduct ? null : p);
                          setSelectedProfile(null);
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
              <div className="space-y-2">
                {materials.map((m, i) => (
                  <MaterialRow
                    key={i}
                    match={m}
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
              {canProceedStep2 ? "Confirmar e Iniciar" : "Materiais em falta"}
            </Button>
          )}

          {step === 3 && (
            <Button
              size="sm"
              onClick={() => {
                onDispatched();
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
