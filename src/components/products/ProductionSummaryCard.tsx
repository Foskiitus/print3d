"use client";

// src/components/products/ProductionSummaryCard.tsx
//
// Card de Resumo de Produção — calcula automaticamente a receita mais eficiente
// para a quantidade desejada, mostrando filamento, tempo, custo real e avisos.

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Clock,
  Euro,
  AlertTriangle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilamentReq {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

interface ComponentProfile {
  id: string;
  name: string;
  printTime: number | null; // minutos
  filamentUsed: number | null; // gramas totais para o lote
  batchSize: number;
  filaments: FilamentReq[];
}

interface Component {
  id: string;
  name: string;
  requiresAdapter?: boolean;
  specialHandling?: string | null;
  profiles: ComponentProfile[];
}

interface BOMEntry {
  id: string;
  quantity: number; // quantas unidades deste componente por produto
  component: Component;
}

interface Spool {
  id: string;
  priceCents: number;
  initialWeight: number; // gramas
  currentWeight: number;
  item: {
    material: string;
    colorHex: string;
    colorName: string;
  };
}

interface ProductionSummaryCardProps {
  bom: BOMEntry[];
  margin: number;
  extrasCostPerUnit: number;
  spools?: Spool[]; // rolos carregados na impressora (opcional)
  fallbackPricePerG?: number; // €/g se não houver spools (default 0.025)
}

// ─── Algoritmo de Receita Óptima ──────────────────────────────────────────────

interface RecipeRun {
  profile: ComponentProfile;
  runs: number; // quantas vezes executar este perfil
  units: number; // unidades produzidas neste bloco
}

/**
 * Para uma quantidade desejada `qty` de um componente,
 * escolhe a combinação de perfis que minimiza o número de runs.
 *
 * Estratégia:
 *  1. Ordena perfis por batchSize DESC (maior lote primeiro).
 *  2. Preenche gananciosamente com o maior lote disponível.
 *  3. O resto cobre com o perfil de batchSize mais próximo.
 */
function bestRecipe(profiles: ComponentProfile[], qty: number): RecipeRun[] {
  if (profiles.length === 0 || qty <= 0) return [];

  // Ordenar por batchSize DESC — garantir que batchSize nunca é undefined/0
  const sorted = [...profiles]
    .map((p) => ({ ...p, batchSize: p.batchSize || 1 }))
    .sort((a, b) => b.batchSize - a.batchSize);
  const runs: RecipeRun[] = [];
  let remaining = qty;

  for (const profile of sorted) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / profile.batchSize);
    if (count > 0) {
      runs.push({ profile, runs: count, units: count * profile.batchSize });
      remaining -= count * profile.batchSize;
    }
  }

  // Se ainda sobrar alguma unidade, usa o menor perfil disponível (inevitavelmente desperdício)
  if (remaining > 0) {
    const smallest = sorted[sorted.length - 1];
    const existing = runs.find((r) => r.profile.id === smallest.id);
    if (existing) {
      existing.runs += 1;
      existing.units += smallest.batchSize;
    } else {
      runs.push({ profile: smallest, runs: 1, units: smallest.batchSize });
    }
  }

  return runs;
}

// ─── Custo real baseado em spools ─────────────────────────────────────────────

function pricePerGram(
  material: string,
  colorHex: string | null,
  spools: Spool[],
  fallback: number,
): number {
  // Tenta encontrar spool carregado com material + cor correspondente
  const match = spools.find(
    (s) =>
      s.item.material.toLowerCase() === material.toLowerCase() &&
      (!colorHex || s.item.colorHex.toLowerCase() === colorHex.toLowerCase()),
  );
  if (match && match.initialWeight > 0) {
    return match.priceCents / 100 / match.initialWeight;
  }
  // Fallback: qualquer spool do mesmo material
  const matMatch = spools.find(
    (s) => s.item.material.toLowerCase() === material.toLowerCase(),
  );
  if (matMatch && matMatch.initialWeight > 0) {
    return matMatch.priceCents / 100 / matMatch.initialWeight;
  }
  return fallback;
}

// ─── Formatar minutos → "Xh Ym" ──────────────────────────────────────────────

function fmtTime(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductionSummaryCard({
  bom,
  margin,
  extrasCostPerUnit,
  spools = [],
  fallbackPricePerG = 0.025,
}: ProductionSummaryCardProps) {
  const [qty, setQty] = useState(1);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const summary = useMemo(() => {
    if (bom.length === 0 || qty <= 0) return null;

    // DEBUG — remove após confirmar dados
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[ProductionSummaryCard] bom:",
        JSON.stringify(
          bom.map((e) => ({
            component: e.component.name,
            qty: e.quantity,
            profiles: e.component.profiles?.map((p) => ({
              name: p.name,
              batchSize: p.batchSize,
              printTime: p.printTime,
              filamentUsed: p.filamentUsed,
              filaments: p.filaments?.length,
            })),
          })),
          null,
          2,
        ),
      );
    }

    // Agrega filamento por (material + colorHex)
    const filamentMap = new Map<
      string,
      {
        material: string;
        colorHex: string | null;
        colorName: string | null;
        totalG: number;
      }
    >();

    let totalMinutes = 0;
    let totalCost = 0;
    const breakdown: {
      componentName: string;
      runs: RecipeRun[];
      requiresAdapter: boolean;
      specialHandling: string | null;
    }[] = [];

    const adapterWarnings: string[] = [];

    for (const entry of bom) {
      const neededUnits = entry.quantity * qty;
      const profiles = entry.component.profiles ?? [];
      const runs = bestRecipe(profiles, neededUnits);

      if (entry.component.requiresAdapter) {
        adapterWarnings.push(entry.component.name);
      }

      breakdown.push({
        componentName: entry.component.name,
        runs,
        requiresAdapter: !!entry.component.requiresAdapter,
        specialHandling: entry.component.specialHandling ?? null,
      });

      for (const run of runs) {
        // Tempo
        if (run.profile.printTime) {
          totalMinutes += run.profile.printTime * run.runs;
        }

        // Filamento por cor
        for (const fil of run.profile.filaments) {
          const key = `${fil.material}__${fil.colorHex ?? ""}`;
          const gramsPerRun = fil.estimatedG; // gramas para o lote inteiro
          const totalG = gramsPerRun * run.runs;

          const existing = filamentMap.get(key);
          if (existing) {
            existing.totalG += totalG;
          } else {
            filamentMap.set(key, {
              material: fil.material,
              colorHex: fil.colorHex,
              colorName: fil.colorName,
              totalG,
            });
          }

          // Custo
          const ppg = pricePerGram(
            fil.material,
            fil.colorHex,
            spools,
            fallbackPricePerG,
          );
          totalCost += totalG * ppg;
        }

        // Se o perfil não tem filamentos detalhados, usa filamentUsed total
        if (run.profile.filaments.length === 0 && run.profile.filamentUsed) {
          const key = `unknown__`;
          const totalG = run.profile.filamentUsed * run.runs;
          const existing = filamentMap.get(key);
          if (existing) {
            existing.totalG += totalG;
          } else {
            filamentMap.set(key, {
              material: "—",
              colorHex: null,
              colorName: null,
              totalG,
            });
          }
          totalCost += totalG * fallbackPricePerG;
        }
      }
    }

    // Custo total por unidade = (filamento + extras) * margem
    const extrasCost = extrasCostPerUnit * qty;
    const totalFilamentCost = totalCost;
    const grandTotalCost = totalFilamentCost + extrasCost;
    const suggestedRevenue = grandTotalCost * (1 + margin);

    return {
      filaments: Array.from(filamentMap.values()),
      totalMinutes,
      totalFilamentCost,
      extrasCost,
      grandTotalCost,
      suggestedRevenue,
      breakdown,
      adapterWarnings,
      usingFallback: spools.length === 0,
    };
  }, [bom, qty, spools, margin, extrasCostPerUnit, fallbackPricePerG]);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Header + input de quantidade */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Resumo de Produção
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Produzir</span>
            <Input
              type="number"
              min="1"
              max="9999"
              value={qty}
              onChange={(e) => {
                const v = Math.max(1, parseInt(e.target.value) || 1);
                setQty(v);
              }}
              className="h-7 w-16 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">un.</span>
          </div>
        </div>

        {!summary || bom.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Adiciona componentes à BOM para ver o resumo de produção.
          </p>
        ) : (
          <>
            {/* Avisos críticos */}
            {summary.adapterWarnings.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Wrench
                  size={13}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-medium text-amber-600">
                    Adaptador necessário
                  </p>
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    {summary.adapterWarnings.join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-2">
              {/* Tempo */}
              <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <Clock size={9} />
                  Tempo total
                </div>
                <p className="text-base font-bold text-foreground">
                  {fmtTime(summary.totalMinutes)}
                </p>
              </div>

              {/* Custo */}
              <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <Euro size={9} />
                  Custo total
                </div>
                <p className="text-base font-bold text-foreground">
                  {formatCurrency(summary.grandTotalCost)}
                </p>
              </div>
            </div>

            {/* Filamentos necessários */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Layers size={9} />
                Filamento necessário
              </p>
              <div className="space-y-1.5">
                {summary.filaments.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-border"
                      style={{ backgroundColor: f.colorHex ?? "#888" }}
                    />
                    <span className="text-xs text-foreground flex-1">
                      {f.material}
                      {f.colorName ? (
                        <span className="text-muted-foreground">
                          {" "}
                          {f.colorName}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {Math.ceil(f.totalG)}g
                    </span>
                    {/* Aviso se o spool não chega */}
                    {spools.length > 0 &&
                      (() => {
                        const spool = spools.find(
                          (s) =>
                            s.item.material.toLowerCase() ===
                              f.material.toLowerCase() &&
                            (!f.colorHex ||
                              s.item.colorHex.toLowerCase() ===
                                (f.colorHex ?? "").toLowerCase()),
                        );
                        if (!spool)
                          return (
                            <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                              sem rolo
                            </Badge>
                          );
                        if (spool.currentWeight < Math.ceil(f.totalG))
                          return (
                            <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                              insuf. ({Math.round(spool.currentWeight)}g)
                            </Badge>
                          );
                        return (
                          <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            ok ({Math.round(spool.currentWeight)}g)
                          </Badge>
                        );
                      })()}
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhe de custos */}
            <div className="space-y-1.5 border-t border-border pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Filamento</span>
                <span>{formatCurrency(summary.totalFilamentCost)}</span>
              </div>
              {summary.extrasCost > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Extras</span>
                  <span>{formatCurrency(summary.extrasCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                <span>Custo total ({qty} un.)</span>
                <span>{formatCurrency(summary.grandTotalCost)}</span>
              </div>
              <div className="flex justify-between text-xs text-primary font-semibold">
                <span>
                  Receita sugerida ({Math.round(margin * 100)}% margem)
                </span>
                <span>{formatCurrency(summary.suggestedRevenue)}</span>
              </div>
            </div>

            {/* Breakdown por componente (expansível) */}
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showBreakdown ? (
                <ChevronUp size={10} />
              ) : (
                <ChevronDown size={10} />
              )}
              {showBreakdown ? "Ocultar" : "Ver"} detalhe por componente
            </button>

            {showBreakdown && (
              <div className="space-y-3 pt-1">
                {summary.breakdown.map((b, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground">
                        {b.componentName}
                      </p>
                      {b.requiresAdapter && (
                        <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          <Wrench size={8} className="mr-0.5" />
                          adaptador
                        </Badge>
                      )}
                    </div>
                    {b.specialHandling && (
                      <p className="text-[10px] text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={9} />
                        {b.specialHandling}
                      </p>
                    )}
                    {b.runs.map((run, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-2 pl-3 text-[10px] text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {run.runs}× {run.profile.name}
                        </span>
                        <span>
                          ({run.units} un. ·{" "}
                          {run.profile.filamentUsed
                            ? `${Math.round(run.profile.filamentUsed * run.runs)}g`
                            : "—"}
                          {run.profile.printTime
                            ? ` · ${fmtTime(run.profile.printTime * run.runs)}`
                            : ""}
                          )
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Nota sobre preços */}
            {summary.usingFallback && (
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Info size={10} className="flex-shrink-0 mt-0.5" />
                <span>
                  Custo calculado com €{fallbackPricePerG.toFixed(3)}/g
                  estimado. Carrega rolos com preço real para valores precisos.
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
