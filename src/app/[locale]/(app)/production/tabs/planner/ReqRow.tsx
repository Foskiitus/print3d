"use client";
// src/app/[locale]/(app)/production/tabs/planner/ReqRow.tsx
//
// Uma linha por requisito de filamento da peça.
// Candidatos = slots físicos da impressora.
// Semáforo: verde (mat+cor ok) | amarelo (mat ok, cor ≠) | vermelho (mat ≠, bloqueia)
// Trocar: expande painel com QR scan + search para carregar novo spool no slot.

import { useState } from "react";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Wrench,
  X,
  QrCode,
  CameraOff,
  Loader2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FilamentReq } from "../../ProductionPageClient";
import type { AvailableSpool } from "./types";
import {
  materialsAreCompatible,
  colorDist,
  COLOR_TOLERANCE,
} from "./filament-helpers";

export function ReqRow({
  req,
  reqIdx,
  effectiveSlots,
  assignedSlotId,
  onAssignSlot,
  onLoadSpool,
  knownSpools,
  conflictSlotIds,
  scanState,
}: {
  req: FilamentReq;
  reqIdx: number;
  effectiveSlots: Array<{
    id: string;
    position: number;
    unitName: string;
    effectiveSpool: AvailableSpool | null;
  }>;
  assignedSlotId: string | null;
  onAssignSlot: (slotId: string | null) => void;
  onLoadSpool: (slotId: string, spoolId: string | null) => void;
  knownSpools: AvailableSpool[];
  conflictSlotIds: Set<string>;
  scanState: {
    activeKey: string | null;
    flash: Record<string, "ok" | "warn" | "error" | null>;
    scanStatus: string;
    scanError: string | null | undefined;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    openScanner: (key: string) => void;
    closeScanner: () => void;
    persisting: Record<string, boolean>;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const assignedSlot = assignedSlotId
    ? (effectiveSlots.find((s) => s.id === assignedSlotId) ?? null)
    : null;
  const assignedSpool = assignedSlot?.effectiveSpool ?? null;

  function spoolStatus(
    spool: AvailableSpool | null,
  ): "empty" | "green" | "yellow" | "red" {
    if (!spool) return "empty";
    if (!materialsAreCompatible(spool.item.material, req.material))
      return "red";
    if (!req.colorHex) return "green";
    return colorDist(spool.item.colorHex, req.colorHex) <= COLOR_TOLERANCE
      ? "green"
      : "yellow";
  }

  const assignedStatus = spoolStatus(assignedSpool);
  const hasConflict =
    assignedSlotId !== null && conflictSlotIds.has(assignedSlotId);
  const effectiveStatus: "empty" | "green" | "yellow" | "red" = hasConflict
    ? "red"
    : assignedStatus;

  const scanKey = `req-${reqIdx}`;
  const isScanning = scanState.activeKey === scanKey;
  const flash = scanState.flash[scanKey];
  const isPersisting = assignedSlotId
    ? (scanState.persisting[assignedSlotId] ?? false)
    : false;

  const borderClass =
    flash === "ok"
      ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
      : flash === "warn"
        ? "border-amber-500 bg-amber-500/5 shadow-[0_0_0_2px_rgba(245,158,11,0.15)]"
        : flash === "error"
          ? "border-destructive bg-destructive/5 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]"
          : effectiveStatus === "green"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : effectiveStatus === "yellow"
              ? "border-amber-500/30 bg-amber-500/5"
              : effectiveStatus === "red"
                ? "border-destructive/30 bg-destructive/5"
                : "border-dashed border-border/60";

  const statusIconEl =
    flash === "ok" ? (
      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
    ) : flash === "warn" ? (
      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
    ) : flash === "error" ? (
      <XCircle size={14} className="text-destructive flex-shrink-0" />
    ) : effectiveStatus === "green" ? (
      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
    ) : effectiveStatus === "yellow" ? (
      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
    ) : effectiveStatus === "red" ? (
      <XCircle size={14} className="text-destructive flex-shrink-0" />
    ) : (
      <div className="w-3.5 h-3.5 rounded-full border-2 border-border flex-shrink-0" />
    );

  const filteredSpools = knownSpools
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.qrCodeId.toLowerCase().includes(q) ||
        s.item.brand.toLowerCase().includes(q) ||
        s.item.material.toLowerCase().includes(q) ||
        s.item.colorName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aOk = materialsAreCompatible(a.item.material, req.material) ? 0 : 1;
      const bOk = materialsAreCompatible(b.item.material, req.material) ? 0 : 1;
      return aOk - bOk;
    });

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-200",
        borderClass,
      )}
    >
      {/* Cabeçalho do requisito */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {statusIconEl}
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
        {isPersisting && (
          <Loader2
            size={11}
            className="animate-spin text-muted-foreground flex-shrink-0"
          />
        )}
      </div>

      {/* Avisos */}
      {effectiveStatus === "yellow" && assignedSpool && (
        <div className="px-3 pb-2 flex items-start gap-1.5">
          <AlertTriangle
            size={11}
            className="text-amber-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-amber-700">
            Cor diferente ({assignedSpool.item.colorName} vs{" "}
            {req.colorName ?? "original"}). Material ok — podes avançar.
          </p>
        </div>
      )}
      {effectiveStatus === "red" && assignedSpool && !hasConflict && (
        <div className="px-3 pb-2 flex items-start gap-1.5">
          <XCircle
            size={11}
            className="text-destructive flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-destructive">
            Material incompatível ({assignedSpool.item.material} ≠{" "}
            {req.material}).
          </p>
        </div>
      )}
      {hasConflict && (
        <div className="px-3 pb-2 flex items-start gap-1.5">
          <AlertTriangle
            size={11}
            className="text-destructive flex-shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-destructive">
            Este slot já está atribuído a outro requisito.
          </p>
        </div>
      )}

      {/* Lista de slots candidatos */}
      <div className="border-t border-border/40 divide-y divide-border/20">
        {effectiveSlots.length === 0 && (
          <p className="px-3 py-2 text-[10px] text-muted-foreground italic">
            Impressora sem slots configurados.
          </p>
        )}
        {effectiveSlots.map((slot) => {
          const isAssigned = assignedSlotId === slot.id;
          const isConflicted = !isAssigned && conflictSlotIds.has(slot.id);
          const spool = slot.effectiveSpool;
          const st = spoolStatus(spool);

          return (
            <div key={slot.id}>
              {/* Linha do slot: zona de seleção (div) + botão Trocar (button) */}
              <div
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 transition-colors",
                  isAssigned
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : isConflicted
                      ? "opacity-40"
                      : "hover:bg-muted/40",
                )}
              >
                {/* Zona clicável para atribuir/desatribuir */}
                <div
                  role="button"
                  tabIndex={isConflicted ? -1 : 0}
                  onClick={() => {
                    if (!isConflicted) {
                      onAssignSlot(isAssigned ? null : slot.id);
                      if (!isAssigned) setExpanded(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isConflicted) {
                      e.preventDefault();
                      onAssignSlot(isAssigned ? null : slot.id);
                      if (!isAssigned) setExpanded(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 flex-1 min-w-0",
                    isConflicted ? "cursor-not-allowed" : "cursor-pointer",
                  )}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: isAssigned
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                      backgroundColor: isAssigned
                        ? "hsl(var(--primary))"
                        : "transparent",
                    }}
                  >
                    {isAssigned && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {slot.position}
                    </span>
                  </div>
                  {spool ? (
                    <>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                        style={{ backgroundColor: spool.item.colorHex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-tight truncate">
                          {spool.item.brand} {spool.item.material}{" "}
                          {spool.item.colorName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          #{spool.qrCodeId.slice(-6)} · {spool.currentWeight}g
                        </p>
                      </div>
                    </>
                  ) : (
                    <span className="flex-1 text-xs text-muted-foreground italic">
                      Slot vazio
                    </span>
                  )}
                  <div className="flex-shrink-0">
                    {isConflicted && (
                      <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                        em uso
                      </Badge>
                    )}
                    {!isConflicted && st === "green" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                        ✓
                      </span>
                    )}
                    {!isConflicted && st === "yellow" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        ⚠ cor
                      </span>
                    )}
                    {!isConflicted && st === "red" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        ✗ mat
                      </span>
                    )}
                  </div>
                </div>
                {/* Botão Trocar — fora da zona de seleção */}
                {isAssigned && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/60 bg-muted/30 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <Wrench size={10} />
                    {expanded ? "Fechar" : "Trocar"}
                  </button>
                )}
              </div>

              {/* Painel de troca: só no slot atribuído + expanded */}
              {isAssigned && expanded && (
                <div className="bg-background/60 border-t border-border/30">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
                    <button
                      type="button"
                      onClick={() =>
                        isScanning
                          ? scanState.closeScanner()
                          : scanState.openScanner(scanKey)
                      }
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium border transition-colors flex-shrink-0",
                        isScanning
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
                      )}
                    >
                      {isScanning ? (
                        <>
                          <CameraOff size={11} /> Fechar
                        </>
                      ) : (
                        <>
                          <QrCode size={11} /> Scan QR
                        </>
                      )}
                    </button>
                    <div className="relative flex-1">
                      <Search
                        size={11}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ID, marca, material, cor…"
                        className="w-full pl-7 pr-6 py-1.5 text-xs bg-muted/30 border border-border/50 rounded-md placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isScanning && (
                    <div className="mx-3 my-2 rounded-lg overflow-hidden bg-black relative">
                      {scanState.scanStatus === "requesting" && (
                        <div className="flex items-center justify-center gap-2 py-8 text-white text-xs">
                          <Loader2 size={14} className="animate-spin" /> A
                          aceder à câmara...
                        </div>
                      )}
                      {scanState.scanStatus === "error" && (
                        <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                          <CameraOff size={20} className="text-destructive" />
                          <p className="text-xs text-destructive">
                            {scanState.scanError}
                          </p>
                        </div>
                      )}
                      {"BarcodeDetector" in
                        (typeof window !== "undefined" ? window : {}) && (
                        <video
                          ref={scanState.videoRef}
                          className={cn(
                            "w-full max-h-44 object-cover",
                            scanState.scanStatus !== "scanning" && "hidden",
                          )}
                          playsInline
                          muted
                          autoPlay
                        />
                      )}
                      {!(
                        "BarcodeDetector" in
                        (typeof window !== "undefined" ? window : {})
                      ) && (
                        <div
                          id="qr-scanner-video"
                          className={cn(
                            "w-full",
                            scanState.scanStatus !== "scanning" && "hidden",
                          )}
                        />
                      )}
                      {scanState.scanStatus === "scanning" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-32 h-32 border-2 border-white/70 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl" />
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="divide-y divide-border/20 max-h-44 overflow-y-auto">
                    {filteredSpools.length === 0 && (
                      <p className="px-3 py-3 text-[10px] text-muted-foreground italic text-center">
                        {search
                          ? `Sem resultados para "${search}"`
                          : "Sem spools no inventário."}
                      </p>
                    )}
                    {filteredSpools.map((s) => {
                      const isCurrent = spool?.id === s.id;
                      const sSt = spoolStatus(s);
                      const matOk = materialsAreCompatible(
                        s.item.material,
                        req.material,
                      );
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!matOk}
                          onClick={() => {
                            onLoadSpool(slot.id, s.id);
                            setExpanded(false);
                            setSearch("");
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors",
                            !matOk
                              ? "opacity-35 cursor-not-allowed"
                              : isCurrent
                                ? "bg-primary/5"
                                : "hover:bg-muted/40",
                          )}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                            style={{
                              borderColor: isCurrent
                                ? "hsl(var(--primary))"
                                : "hsl(var(--border))",
                              backgroundColor: "transparent",
                            }}
                          />
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                            style={{ backgroundColor: s.item.colorHex }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground leading-tight truncate">
                              {s.item.brand} {s.item.material}{" "}
                              {s.item.colorName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              #{s.qrCodeId.slice(-6)} · {s.currentWeight}g (
                              {Math.round(
                                (s.currentWeight / s.initialWeight) * 100,
                              )}
                              %)
                            </p>
                          </div>
                          {sSt === "green" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 flex-shrink-0">
                              ✓
                            </span>
                          )}
                          {sSt === "yellow" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex-shrink-0">
                              ⚠ cor
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {spool && (
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSpool(slot.id, null);
                          setExpanded(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors hover:bg-destructive/5"
                      >
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-border/50 flex-shrink-0" />
                        <span className="text-[11px] text-muted-foreground">
                          Esvaziar slot
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
