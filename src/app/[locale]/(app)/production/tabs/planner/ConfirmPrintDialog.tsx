"use client";
// src/app/[locale]/(app)/production/tabs/planner/ConfirmPrintDialog.tsx
//
// Dialog de confirmação de lançamento de impressão.
// Abre quando o pre-flight passa (slots correctos).
// Mostra resumo de materiais, custo estimado e escolha de corridas.

import { AlertTriangle, Zap, X, Clock, Layers, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Printer as PrinterType } from "../../ProductionPageClient";
import type { ConfirmState } from "./types";
import { fmtTime } from "./planner-helpers";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

export function ConfirmPrintDialog({
  state,
  materialPriceMap,
  onConfirm,
  onCancel,
}: {
  state: ConfirmState;
  materialPriceMap: Record<string, number>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = useIntlayer("production");
  const { part, printer, platesNeeded, profilePlates } = state;
  const profile = part.profile;
  const [loading, setLoading] = useState(false);

  const batchSize = profile?.batchSize ?? 1;
  const isMultiPlate = profilePlates.length > 1;

  // Cada card = exactamente 1 corrida — sem escolha necessária
  const runs = 1;
  const piecesProduced = part.unitsThisPrint;

  // Tempo total = soma do tempo de TODAS as placas × corridas
  const totalPlateMinutes = profilePlates.reduce(
    (s, p) => s + (p.printTime ?? 0),
    0,
  );
  const estimatedMinutes =
    totalPlateMinutes > 0 ? Math.round(totalPlateMinutes * runs) : null;

  // Custo de filamento = soma de todos os req de todas as placas × corridas
  const filamentCostPerRun = profilePlates.reduce((runAcc, plate) => {
    const plateCost = plate.filaments.reduce((acc, f) => {
      const pricePerG = materialPriceMap[f.material] ?? 0.025;
      return acc + f.estimatedG * pricePerG;
    }, 0);
    return runAcc + plateCost;
  }, 0);
  // Fallback para filamentos do perfil raiz (quando não há placas com filaments)
  const filamentCostPerRunFallback =
    profile?.filaments.reduce((acc, f) => {
      const pricePerG = materialPriceMap[f.material] ?? 0.025;
      return acc + f.estimatedG * pricePerG;
    }, 0) ?? 0;
  const effectiveCostPerRun = filamentCostPerRun || filamentCostPerRunFallback;
  const filamentCost = effectiveCostPerRun * runs;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-background border border-border rounded-2xl w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {c.planner.confirm.title.value}
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Componente + impressora */}
          <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {part.component.name}
            </p>
            <p className="text-xs text-muted-foreground">→ {printer.name}</p>
          </div>

          {/* Alerta adaptador */}
          {part.component.requiresAdapter && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
              <AlertTriangle
                size={12}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700">
                {c.planner.adapterWarning.value}
              </p>
            </div>
          )}

          {/* Multi-mesa: mostrar breakdown das placas */}
          {isMultiPlate && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Mesas — {profilePlates.length} ficheiros de impressão
              </p>
              {profilePlates.map((plate) => (
                <div
                  key={plate.plateNumber}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Mesa {plate.plateNumber}
                    </span>
                    {plate.name && (
                      <span className="ml-1 text-muted-foreground">
                        — {plate.name}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{plate.batchSize} peças/corrida</span>
                    {plate.printTime && (
                      <span className="flex items-center gap-0.5">
                        <Clock size={9} />
                        {fmtTime(plate.printTime)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumo */}
          <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-xs">
            {/* Mesa X/Y da OP */}
            {part.totalPrints > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mesa</span>
                <span className="font-medium text-primary">
                  {part.printIndex + 1} / {part.totalPrints}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Peças nesta mesa</span>
              <span className="font-medium text-foreground">
                {part.unitsThisPrint}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total da OP</span>
              <span className="font-medium text-foreground">
                {part.quantityNeeded}
              </span>
            </div>
            {estimatedMinutes && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {c.planner.confirm.estimatedTime.value}
                </span>
                <span className="font-medium text-foreground">
                  {fmtTime(estimatedMinutes)}
                  {isMultiPlate && runs > 0 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({fmtTime(totalPlateMinutes)}/corrida × {runs})
                    </span>
                  )}
                </span>
              </div>
            )}
            {filamentCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Custo filamento</span>
                <span className="font-medium text-foreground">
                  €{filamentCost.toFixed(3)}
                  {runs > 1 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (€{effectiveCostPerRun.toFixed(3)}/corrida × {runs})
                    </span>
                  )}
                </span>
              </div>
            )}
            {/* Filamentos da primeira placa (ou do perfil raiz) */}
            {(profilePlates[0]?.filaments ?? profile?.filaments ?? []).length >
              0 && (
              <div className="pt-1 border-t border-border flex flex-wrap gap-1.5">
                {(profilePlates[0]?.filaments?.length > 0
                  ? profilePlates[0].filaments
                  : (profile?.filaments ?? [])
                ).map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: f.colorHex ?? "#888" }}
                    />
                    <span className="text-muted-foreground">
                      {f.material} {f.estimatedG}g/corrida
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={onCancel}
          >
            {c.planner.confirm.cancel.value}
          </Button>
          <Button
            className="flex-1"
            size="sm"
            onClick={() => onConfirm()}
            disabled={loading}
          >
            <Check size={13} className="mr-1.5" />
            {c.planner.confirm.launch.value}
          </Button>
        </div>
      </div>
    </div>
  );
}
