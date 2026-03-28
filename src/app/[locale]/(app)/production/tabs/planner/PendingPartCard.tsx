"use client";
// src/app/[locale]/(app)/production/tabs/planner/PendingPartCard.tsx
//
// Card arrastável de uma peça pendente no Planeador.
// Mostra OP, componente, perfil de impressão e badge "Mesa X/Y".

import {
  AlertTriangle,
  Clock,
  Layers,
  BadgeCheck,
  Wrench,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PendingPart, ProfilePlate } from "./types";
import { fmtTime } from "./planner-helpers";
import { useIntlayer } from "next-intlayer";

export function PendingPartCard({
  part,
  onDragStart,
  onSelect,
  selected,
  onProfileChange,
}: {
  part: PendingPart;
  onDragStart: (part: PendingPart) => void;
  onSelect: (part: PendingPart) => void;
  selected: boolean;
  // Chamado quando o utilizador escolhe um perfil diferente (multi-perfil)
  onProfileChange?: (profileId: string) => void;
}) {
  const c = useIntlayer("production");
  const profile = part.profile;
  const allProfiles = part.component.profiles ?? [];
  const hasMultipleProfiles = allProfiles.length > 1;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(part)}
      onClick={() => onSelect(part)}
      className={cn(
        "rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-all space-y-2",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:border-primary/30",
        part.isUrgent && "border-l-2 border-l-red-500",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {part.component.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <p className="text-[10px] text-muted-foreground font-mono">
              OP #{part.orderRef}
            </p>
            {part.totalPrints > 1 && (
              <span className="text-[9px] px-1.5 py-0 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                Mesa {part.printIndex + 1}/{part.totalPrints}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {part.isUrgent && (
            <Badge className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/20">
              🚨
            </Badge>
          )}
          {part.component.requiresAdapter && (
            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 gap-0.5">
              <Wrench size={8} />
              {c.planner.adapterRequired.value}
            </Badge>
          )}
          <span
            className="text-xs font-bold text-foreground"
            title={`${part.unitsThisPrint} peças nesta mesa (${part.quantityNeeded} total)`}
          >
            ×{part.unitsThisPrint}
          </span>
        </div>
      </div>

      {/* Seletor de perfil — só quando há múltiplos */}
      {hasMultipleProfiles && onProfileChange && (
        <div
          className="flex gap-1 flex-wrap"
          onClick={(e) => e.stopPropagation()} // evitar activar onSelect
          onMouseDown={(e) => e.stopPropagation()} // evitar drag
        >
          {allProfiles.map((p: any) => {
            const isActive = profile?.id === p.id;
            const modelLabel =
              p.printerPreset?.model ?? p.printerPreset?.name ?? null;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProfileChange(p.id)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-medium transition-colors",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <Printer size={8} />
                {modelLabel ? modelLabel : p.name}
              </button>
            );
          })}
        </div>
      )}

      {profile && (
        <div className="flex items-center gap-2 flex-wrap">
          {(() => {
            // Multi-mesa: verificar se o perfil tem placas definidas
            const plates = (profile as any)?.plates as
              | ProfilePlate[]
              | undefined;
            const isMultiPlate = plates && plates.length > 1;

            if (isMultiPlate) {
              const totalTime = plates.reduce(
                (s, p) => s + (p.printTime ?? 0),
                0,
              );
              const runsNeeded = Math.ceil(
                part.quantityNeeded / profile.batchSize,
              );
              return (
                <>
                  <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Layers size={9} />
                    {plates.length} mesas
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={9} />
                    {fmtTime(totalTime)}/corrida
                  </span>
                  {runsNeeded > 1 && (
                    <span className="text-[10px] text-muted-foreground">
                      × {runsNeeded} corridas
                    </span>
                  )}
                </>
              );
            }

            // Mono-mesa: comportamento original
            return (
              <>
                {profile.batchSize > 1 && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Layers size={9} />
                    {Math.ceil(part.quantityNeeded / profile.batchSize)} placa
                    {Math.ceil(part.quantityNeeded / profile.batchSize) > 1
                      ? "s"
                      : ""}{" "}
                    × {profile.batchSize} peças
                  </span>
                )}
                {profile.printTime && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={9} />
                    {fmtTime(profile.printTime)}/placa
                  </span>
                )}
                {profile.filamentUsed && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Layers size={9} />
                    {profile.filamentUsed}g/placa
                  </span>
                )}
              </>
            );
          })()}
          {profile.filaments.slice(0, 6).map((f, i) => (
            <span key={i} className="flex items-center gap-0.5">
              <div
                className="w-2 h-2 rounded-full"
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
  );
}
