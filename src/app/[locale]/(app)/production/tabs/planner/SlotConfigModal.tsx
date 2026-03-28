"use client";
// src/app/[locale]/(app)/production/tabs/planner/SlotConfigModal.tsx
//
// Modal de configuração de slots que abre quando o pre-flight falha.
// Permite associar um spool a cada requisito de filamento por slot.
// Suporta QR scan, pesquisa por texto, cores diferentes do requisito original.

import { useState, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, Zap, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { useQrScanner } from "@/hooks/useQrScanner";
import type {
  Printer as PrinterType,
  PrinterUnit,
  PrinterSlot,
  FilamentReq,
} from "../../ProductionPageClient";
import type { PendingPart, AvailableSpool, ProfilePlate } from "./types";
import { SITE_URL } from "./types";
import {
  materialsAreCompatible,
  colorDist,
  COLOR_TOLERANCE,
} from "./filament-helpers";
import { ReqRow } from "./ReqRow";

export function SlotConfigModal({
  open,
  part,
  printer,
  availableSpools,
  onConfirm,
  onClose,
}: {
  open: boolean;
  part: PendingPart | null;
  printer: PrinterType | null;
  availableSpools: AvailableSpool[];
  onConfirm: (
    slotAssignments: { slotId: string; spoolId: string | null }[],
    recipe: "single" | "full",
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [reqSlots, setReqSlots] = useState<Record<number, string | null>>({});
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [scannedSpools, setScannedSpools] = useState<
    Record<string, AvailableSpool>
  >({});
  const [recipe, setRecipe] = useState<"single" | "full">("full");
  const [confirming, setConfirming] = useState(false);
  const [persisting, setPersisting] = useState<Record<string, boolean>>({});
  const [scanFlash, setScanFlash] = useState<
    Record<string, "ok" | "warn" | "error" | null>
  >({});

  const [activeScanKey, setActiveScanKey] = useState<string | null>(null);
  const activeScanKeyRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const batchSize = part?.profile?.batchSize ?? 1;
  const quantityNeeded = part?.quantityNeeded ?? 1;
  const platesNeeded = Math.ceil(quantityNeeded / batchSize);
  const requirements: FilamentReq[] = part?.profile?.filaments ?? [];

  const profilePlates: ProfilePlate[] =
    (part?.profile as any)?.plates?.length > 0
      ? (part?.profile as any).plates
      : [
          {
            plateNumber: 1,
            name: null,
            printTime: part?.profile?.printTime ?? null,
            batchSize,
            filaments: [],
          },
        ];
  const isMultiPlate = profilePlates.length > 1;

  const knownSpools = useMemo(() => {
    const map = new Map<string, AvailableSpool>();
    for (const s of availableSpools) map.set(s.id, s);
    for (const s of Object.values(scannedSpools)) map.set(s.id, s);
    return Array.from(map.values());
  }, [availableSpools, scannedSpools]);

  const allSlots = (printer?.units ?? []).flatMap((u: PrinterUnit) =>
    u.slots.map((s: PrinterSlot) => ({ ...s, unitName: u.name })),
  );

  const effectiveSlots = allSlots.map((slot) => {
    const spoolId =
      slot.id in overrides
        ? overrides[slot.id]
        : (slot.currentSpool?.id ?? null);
    const spool = spoolId
      ? (knownSpools.find((s) => s.id === spoolId) ??
        (slot.currentSpool as AvailableSpool | null))
      : null;
    return { ...slot, effectiveSpool: spool };
  });

  // Auto-assign: ao abrir, tentar atribuir slots aos requisitos por material
  useEffect(() => {
    if (!open || requirements.length === 0 || effectiveSlots.length === 0)
      return;
    const initial: Record<number, string | null> = {};
    const usedSlots = new Set<string>();
    const indexed = requirements
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        const ca = effectiveSlots.filter(
          (sl) =>
            sl.effectiveSpool &&
            materialsAreCompatible(
              sl.effectiveSpool.item.material,
              a.r.material,
            ),
        ).length;
        const cb = effectiveSlots.filter(
          (sl) =>
            sl.effectiveSpool &&
            materialsAreCompatible(
              sl.effectiveSpool.item.material,
              b.r.material,
            ),
        ).length;
        return ca - cb;
      });
    for (const { r, i } of indexed) {
      const candidates = effectiveSlots.filter(
        (sl) =>
          !usedSlots.has(sl.id) &&
          sl.effectiveSpool &&
          materialsAreCompatible(sl.effectiveSpool.item.material, r.material),
      );
      const best =
        candidates.find((sl) => {
          if (!r.colorHex || !sl.effectiveSpool?.item.colorHex) return true;
          return (
            colorDist(sl.effectiveSpool.item.colorHex, r.colorHex) <=
            COLOR_TOLERANCE
          );
        }) ??
        candidates[0] ??
        null;
      initial[i] = best?.id ?? null;
      if (best) usedSlots.add(best.id);
    }
    setReqSlots(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const conflictSlotIds = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slotId of Object.values(reqSlots)) {
      if (slotId) counts[slotId] = (counts[slotId] ?? 0) + 1;
    }
    return new Set(
      Object.entries(counts)
        .filter(([, n]) => n > 1)
        .map(([id]) => id),
    );
  }, [reqSlots]);

  const canProceed = (() => {
    if (requirements.length === 0) return true;
    return requirements.every((req, i) => {
      const slotId = reqSlots[i];
      if (!slotId || conflictSlotIds.has(slotId)) return false;
      const spool =
        effectiveSlots.find((s) => s.id === slotId)?.effectiveSpool ?? null;
      return spool && materialsAreCompatible(spool.item.material, req.material);
    });
  })();

  const hasYellow = requirements.some((req, i) => {
    const slotId = reqSlots[i];
    if (!slotId) return false;
    const spool =
      effectiveSlots.find((s) => s.id === slotId)?.effectiveSpool ?? null;
    if (!spool || !req.colorHex) return false;
    return (
      materialsAreCompatible(spool.item.material, req.material) &&
      colorDist(spool.item.colorHex, req.colorHex) > COLOR_TOLERANCE
    );
  });

  async function handleLoadSpool(slotId: string, spoolId: string | null) {
    if (!printer) return;
    setOverrides((prev) => ({ ...prev, [slotId]: spoolId }));
    setPersisting((prev) => ({ ...prev, [slotId]: true }));
    try {
      const res = await fetch(`${SITE_URL}/api/printers/${printer.id}/slots`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ slots: [{ slotId, spoolId }] }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Erro ao guardar slot",
          description: err.error ?? "Falha.",
          variant: "destructive",
        });
        setOverrides((prev) => {
          const n = { ...prev };
          delete n[slotId];
          return n;
        });
      }
    } catch {
      toast({
        title: "Erro ao guardar slot",
        description: "Falha de rede.",
        variant: "destructive",
      });
      setOverrides((prev) => {
        const n = { ...prev };
        delete n[slotId];
        return n;
      });
    } finally {
      setPersisting((prev) => ({ ...prev, [slotId]: false }));
    }
  }

  async function findSpoolByQrCode(
    qrCodeId: string,
  ): Promise<AvailableSpool | null> {
    const norm = qrCodeId.trim().toUpperCase();
    const local = knownSpools.find(
      (s) => s.qrCodeId.trim().toUpperCase() === norm,
    );
    if (local) return local;
    try {
      const res = await fetch(`${SITE_URL}/api/inventory`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const p = data.find(
        (row: any) => row.qrCodeId?.trim().toUpperCase() === norm,
      );
      if (!p) return null;
      return {
        id: p.id,
        qrCodeId: p.qrCodeId,
        currentWeight: p.currentWeight,
        initialWeight: p.initialWeight,
        item: p.item,
      };
    } catch {
      return null;
    }
  }

  const {
    status: scanStatus,
    errorMsg: scanError,
    startScanner,
    stopScanner,
  } = useQrScanner({
    onScan: async (scannedId) => {
      const key = activeScanKeyRef.current;
      if (!key) return;
      const reqIdx = parseInt(key.replace("req-", ""));
      const slotId = reqSlots[reqIdx] ?? null;
      if (!slotId) return;

      const spool = await findSpoolByQrCode(scannedId);
      if (!spool) {
        setScanFlash((prev) => ({ ...prev, [key]: "error" }));
        toast({
          title: "Rolo não encontrado",
          description: `"${scannedId}" não existe no inventário.`,
          variant: "destructive",
        });
        setTimeout(() => setScanFlash((p) => ({ ...p, [key]: null })), 2000);
        activeScanKeyRef.current = null;
        setActiveScanKey(null);
        return;
      }
      setScannedSpools((prev) => ({ ...prev, [spool.id]: spool }));

      const req = requirements[reqIdx];
      if (!materialsAreCompatible(spool.item.material, req?.material ?? "")) {
        setScanFlash((prev) => ({ ...prev, [key]: "error" }));
        toast({
          title: "Material incompatível",
          description: `${spool.item.material} ≠ ${req?.material}. Slot não actualizado.`,
          variant: "destructive",
        });
        setTimeout(() => setScanFlash((p) => ({ ...p, [key]: null })), 2500);
        activeScanKeyRef.current = null;
        setActiveScanKey(null);
        return;
      }

      handleLoadSpool(slotId, spool.id);
      const isExactColor =
        !req?.colorHex ||
        colorDist(spool.item.colorHex, req.colorHex) <= COLOR_TOLERANCE;
      setScanFlash((prev) => ({
        ...prev,
        [key]: isExactColor ? "ok" : "warn",
      }));
      setTimeout(() => setScanFlash((p) => ({ ...p, [key]: null })), 2500);
      activeScanKeyRef.current = null;
      setActiveScanKey(null);
    },
    onInvalidCode: () => {
      const key = activeScanKeyRef.current;
      if (!key) return;
      setScanFlash((prev) => ({ ...prev, [key]: "error" }));
      toast({ title: "QR Code inválido", variant: "destructive" });
      setTimeout(() => setScanFlash((p) => ({ ...p, [key]: null })), 2000);
    },
  });

  function openScanner(key: string) {
    if (activeScanKey) stopScanner();
    activeScanKeyRef.current = key;
    setActiveScanKey(key);
    setTimeout(() => startScanner(videoRef.current), 100);
  }
  function closeScanner() {
    stopScanner();
    activeScanKeyRef.current = null;
    setActiveScanKey(null);
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      const slotChanges = effectiveSlots.map((sl) => ({
        slotId: sl.id,
        spoolId: sl.effectiveSpool?.id ?? null,
      }));
      await onConfirm(slotChanges, recipe);
    } finally {
      setConfirming(false);
    }
  }

  if (!part || !printer || !open) return null;

  const scanState = {
    activeKey: activeScanKey,
    flash: scanFlash,
    scanStatus,
    scanError,
    videoRef,
    openScanner,
    closeScanner,
    persisting,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{printer.name}</p>
            <h3 className="text-sm font-semibold text-foreground mt-0.5">
              Associar Filamentos — {part.component.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {requirements.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 italic">
              Este perfil não tem requisitos de filamento definidos.
            </p>
          ) : (
            requirements.map((req, reqIdx) => (
              <ReqRow
                key={req.id ?? reqIdx}
                req={req}
                reqIdx={reqIdx}
                effectiveSlots={effectiveSlots}
                assignedSlotId={reqSlots[reqIdx] ?? null}
                onAssignSlot={(slotId) =>
                  setReqSlots((prev) => ({ ...prev, [reqIdx]: slotId }))
                }
                onLoadSpool={handleLoadSpool}
                knownSpools={knownSpools}
                conflictSlotIds={conflictSlotIds}
                scanState={scanState}
              />
            ))
          )}
        </div>

        <div className="border-t border-border p-4 space-y-3 flex-shrink-0">
          {batchSize > 1 && (
            <div className="flex gap-2">
              {(["single", "full"] as const).map((r) => {
                const runs = r === "full" ? platesNeeded : 1;
                const pieces = runs * batchSize;
                const mesas = isMultiPlate ? runs * profilePlates.length : runs;
                return (
                  <button
                    key={r}
                    onClick={() => setRecipe(r)}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors",
                      recipe === r
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-border/80",
                    )}
                  >
                    {r === "single"
                      ? "1 corrida"
                      : `${platesNeeded} corrida${platesNeeded > 1 ? "s" : ""}`}
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                      {isMultiPlate ? `${mesas} mesas · ` : ""}
                      {pieces} peça{pieces > 1 ? "s" : ""}
                      {r === "full" && pieces < quantityNeeded && " ⚠"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {hasYellow && (
            <p className="text-[10px] text-amber-700 flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={10} className="flex-shrink-0" />
              Cor diferente em alguns slots. O PrintJob registará a cor real
              usada.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={onClose}
              disabled={confirming}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              size="sm"
              onClick={handleConfirm}
              disabled={!canProceed || confirming}
            >
              {confirming ? (
                "A iniciar..."
              ) : canProceed ? (
                <>
                  <Zap size={13} className="mr-1.5" />
                  Confirmar e Iniciar
                </>
              ) : (
                <>
                  <AlertTriangle size={13} className="mr-1.5" />
                  Requisitos em falta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
