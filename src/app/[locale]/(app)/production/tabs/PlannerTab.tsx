"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  AlertTriangle,
  Clock,
  Layers,
  Printer,
  ShoppingCart,
  Wrench,
  X,
  Check,
  Cpu,
  CheckCircle2,
  Zap,
  QrCode,
  Camera,
  CameraOff,
  Loader2,
  BadgeCheck,
  TriangleAlert,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { runPreflightCheck } from "@/lib/preflight";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchableSelect";
import { useQrScanner } from "@/hooks/useQrScanner";
import type {
  ProductionOrder,
  Printer as PrinterType,
  PrinterSlot,
  PrinterUnit,
  Component,
  ComponentProfile,
  BOMEntry,
  FilamentReq,
} from "../ProductionPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types locais ─────────────────────────────────────────────────────────────

interface PendingPart {
  orderId: string;
  orderRef: string;
  isUrgent: boolean;
  component: Component;
  profile: ComponentProfile | null;
  quantityNeeded: number;
}

interface ConfirmState {
  part: PendingPart;
  printer: PrinterType;
  recipe: "single" | "full";
}

interface AvailableSpool {
  id: string;
  qrCodeId: string;
  currentWeight: number;
  initialWeight: number;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
}

// ─── SlotConfigModal ──────────────────────────────────────────────────────────
//
// Abre quando o pre-flight falha.
//
// Melhorias nesta versão:
//   • SearchableSelect por slot — pesquisa por ID (qrCodeId), marca e cor
//   • Filtro contextual: cada slot mostra primeiro as bobines compatíveis
//     com o material exigido pelo componente (pré-filtradas por material)
//   • Ao seleccionar uma bobine, persiste imediatamente na BD via
//     PUT /api/printers/[id]/slots (server action inline)
//   • Botão "Confirmar e Iniciar" só activa quando preflight.ok === true

// Cor de matching: tolerância RGB
const COLOR_TOLERANCE = 30;

function colorDist(a: string, b: string): number {
  const h = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ];
  try {
    const [ar, ag, ab] = h(a);
    const [br, bg, bb] = h(b);
    return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
  } catch {
    return 999;
  }
}

function spoolMatchesReq(spool: AvailableSpool, req: FilamentReq): boolean {
  if (spool.item.material.toLowerCase() !== req.material.toLowerCase())
    return false;
  if (!req.colorHex) return true;
  return colorDist(spool.item.colorHex, req.colorHex) <= COLOR_TOLERANCE;
}

// Constrói as SearchableSelectOptions para um slot.
// Ordena: primeiro as bobines que satisfazem algum requisito do componente,
// depois as restantes — separadas por um divider visual no label.
function buildSpoolOptions(
  availableSpools: AvailableSpool[],
  requirements: FilamentReq[],
  contextMaterial?: string, // material preferencial para este slot (do requisito não satisfeito)
): SearchableSelectOption[] {
  const empty: SearchableSelectOption = {
    value: "__empty__",
    label: "— Vazio —",
    render: (
      <span className="text-muted-foreground italic text-xs">— Vazio —</span>
    ),
  };

  const compatible: SearchableSelectOption[] = [];
  const others: SearchableSelectOption[] = [];

  for (const s of availableSpools) {
    const isCompatible = requirements.some((r) => spoolMatchesReq(s, r));
    const isContextMatch =
      contextMaterial &&
      s.item.material.toLowerCase() === contextMaterial.toLowerCase();

    // Label para pesquisa: inclui ID, marca, material, cor
    const searchLabel = `[${s.qrCodeId}] ${s.item.brand} ${s.item.material} ${s.item.colorName}`;

    const option: SearchableSelectOption = {
      value: s.id,
      label: searchLabel, // usado pelo filtro de pesquisa
      render: (
        <div className="flex items-center gap-2 w-full min-w-0">
          {/* Amostra de cor */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-border/40"
            style={{ backgroundColor: s.item.colorHex }}
          />
          {/* ID em destaque */}
          <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0">
            [{s.qrCodeId.slice(-6)}]
          </span>
          {/* Descrição */}
          <span className="text-xs truncate">
            {s.item.brand}{" "}
            <span className="font-medium">{s.item.material}</span>{" "}
            {s.item.colorName}
          </span>
          {/* Peso restante */}
          <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
            {s.currentWeight}g
          </span>
          {/* Badge "compatível" */}
          {isCompatible && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20 flex-shrink-0">
              ✓
            </span>
          )}
        </div>
      ),
    };

    // Compatíveis com algum requisito → grupo principal
    // Compatíveis por material contextual → também no grupo principal
    if (isCompatible || isContextMatch) {
      compatible.push(option);
    } else {
      others.push(option);
    }
  }

  // Separador visual entre grupos (apenas se houver os dois)
  const separator: SearchableSelectOption | null =
    compatible.length > 0 && others.length > 0
      ? {
          value: "__sep__",
          label: "",
          disabled: true,
          render: <div className="border-t border-border/50 my-1 -mx-1" />,
        }
      : null;

  return [empty, ...compatible, ...(separator ? [separator] : []), ...others];
}

function SlotConfigModal({
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
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    {},
  );
  const [recipe, setRecipe] = useState<"single" | "full">("full");
  const [confirming, setConfirming] = useState(false);
  const [persisting, setPersisting] = useState<Record<string, boolean>>({});

  // Scanner state: qual slot tem o scanner aberto
  const [activeScanSlotId, setActiveScanSlotId] = useState<string | null>(null);
  // Flash de validação por slot: "ok" | "error" | null
  const [scanFlash, setScanFlash] = useState<
    Record<string, "ok" | "error" | null>
  >({});
  // Ref do elemento de vídeo para BarcodeDetector nativo
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // NOTE: early return moved AFTER all hooks (Rules of Hooks)
  const batchSize = part?.profile?.batchSize ?? 1;
  const requirements: FilamentReq[] = part?.profile?.filaments ?? [];

  const allSlots = (printer?.units ?? []).flatMap((u: PrinterUnit) =>
    u.slots.map((s: PrinterSlot) => ({ ...s, unitName: u.name })),
  );

  const effectiveSlots = allSlots.map((slot) => {
    const assignedId =
      slot.id in assignments
        ? assignments[slot.id]
        : (slot.currentSpool?.id ?? null);
    const spool = assignedId
      ? (availableSpools.find((s) => s.id === assignedId) ??
        (slot.currentSpool as AvailableSpool | null))
      : null;
    return { ...slot, effectiveSpool: spool };
  });

  const preflightSlots = effectiveSlots.map((s) => ({
    id: s.id,
    position: s.position,
    currentSpool: s.effectiveSpool
      ? {
          id: s.effectiveSpool.id,
          qrCodeId: s.effectiveSpool.qrCodeId,
          currentWeight: s.effectiveSpool.currentWeight,
          initialWeight: s.effectiveSpool.initialWeight,
          item: s.effectiveSpool.item,
        }
      : null,
  }));

  const preflight =
    requirements.length > 0
      ? runPreflightCheck(requirements, preflightSlots)
      : { ok: true, missing: [], matched: [] };

  function getContextMaterialForSlot(slotPosition: number): string | undefined {
    const unsatisfied = preflight.missing;
    if (unsatisfied.length === 0) return undefined;
    return unsatisfied[slotPosition % unsatisfied.length]?.material;
  }

  // ── Persistência imediata ao seleccionar ────────────────────────────────
  async function handleSlotChange(slotId: string, spoolId: string | null) {
    const resolved = spoolId === "__empty__" ? null : spoolId;
    setAssignments((prev) => ({ ...prev, [slotId]: resolved }));
    setPersisting((prev) => ({ ...prev, [slotId]: true }));
    if (!printer) return;
    try {
      const res = await fetch(`${SITE_URL}/api/printers/${printer?.id}/slots`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ slots: [{ slotId, spoolId: resolved }] }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Erro ao guardar slot",
          description: err.error,
          variant: "destructive",
        });
        setAssignments((prev) => {
          const n = { ...prev };
          delete n[slotId];
          return n;
        });
      }
    } finally {
      setPersisting((prev) => ({ ...prev, [slotId]: false }));
    }
  }

  // ── QR Scanner por slot ──────────────────────────────────────────────────
  // Cada slot tem o seu próprio scanner mas partilhamos um único hook.
  // Ao ler, fechamos o scanner do slot e aplicamos o resultado.
  const {
    status: scanStatus,
    errorMsg: scanError,
    startScanner,
    stopScanner,
  } = useQrScanner({
    onScan: (spoolId, rawText) => {
      window.alert("Lido: " + spoolId);
      if (!activeScanSlotId) return;
      const slotId = activeScanSlotId;

      // Procurar a bobine pelo qrCodeId (o ID extraído do QR)
      const spool = availableSpools.find(
        (s) => s.qrCodeId.toUpperCase() === spoolId.toUpperCase(),
      );

      if (!spool) {
        setScanFlash((prev) => ({ ...prev, [slotId]: "error" }));
        toast({
          title: "Código Inválido ou Rolo não encontrado",
          description: `"${spoolId}" não existe no inventário.`,
          variant: "destructive",
        });
        setTimeout(
          () => setScanFlash((prev) => ({ ...prev, [slotId]: null })),
          2000,
        );
        setActiveScanSlotId(null);
        return;
      }

      // Verificar compatibilidade de material com os requisitos da peça
      const isCompatible = requirements.some((r) => spoolMatchesReq(spool, r));

      if (!isCompatible && requirements.length > 0) {
        // Material errado — avisar e deixar o utilizador decidir
        const neededMaterials = [
          ...new Set(requirements.map((r) => r.material)),
        ].join(", ");
        const proceed = window.confirm(
          `Leste um rolo de ${spool.item.material} (${spool.item.colorName}), ` +
            `mas esta peça exige: ${neededMaterials}.

` +
            `Queres carregar este rolo na mesma?`,
        );
        if (!proceed) {
          setActiveScanSlotId(null);
          return;
        }
      }

      // Aplicar a bobine ao slot
      handleSlotChange(slotId, spool.id);
      setScanFlash((prev) => ({
        ...prev,
        [slotId]: isCompatible ? "ok" : "error",
      }));
      setTimeout(
        () => setScanFlash((prev) => ({ ...prev, [slotId]: null })),
        2500,
      );
      setActiveScanSlotId(null);
    },
    onInvalidCode: (raw) => {
      if (!activeScanSlotId) return;
      setScanFlash((prev) => ({ ...prev, [activeScanSlotId]: "error" }));
      toast({
        title: "QR Code inválido",
        description: `Formato não reconhecido: "${raw.slice(0, 40)}..."`,
        variant: "destructive",
      });
      setTimeout(
        () => setScanFlash((prev) => ({ ...prev, [activeScanSlotId!]: null })),
        2000,
      );
    },
  });

  function openScanner(slotId: string) {
    if (activeScanSlotId) stopScanner();
    setActiveScanSlotId(slotId);
    // Pequeno delay para o DOM renderizar o elemento de vídeo
    setTimeout(() => startScanner(videoRef.current), 100);
  }

  function closeScanner() {
    stopScanner();
    setActiveScanSlotId(null);
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      const slotChanges = allSlots.map((slot) => ({
        slotId: slot.id,
        spoolId:
          slot.id in assignments
            ? assignments[slot.id]
            : (slot.currentSpool?.id ?? null),
      }));
      await onConfirm(slotChanges, recipe);
    } finally {
      setConfirming(false);
    }
  }

  // All hooks have been called — now safe to do conditional returns
  if (!part || !printer) return null;
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle size={15} className="text-warning" />
            Configurar Slots — {printer.name}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* Requisitos da peça */}
        {requirements.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Filamentos necessários — {part.component.name}
            </p>
            <div className="space-y-1.5">
              {requirements.map((req) => {
                const match = preflight.matched.find(
                  (m) => m.requirement.id === req.id,
                );
                const satisfied = !!match;
                return (
                  <div
                    key={req.id}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                      satisfied
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {satisfied ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <AlertTriangle size={11} />
                    )}
                    {req.colorHex && (
                      <div
                        className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0"
                        style={{ backgroundColor: req.colorHex }}
                      />
                    )}
                    <span className="font-medium">{req.material}</span>
                    {req.colorName && (
                      <span className="opacity-70">· {req.colorName}</span>
                    )}
                    <span className="ml-auto opacity-70">
                      ~{req.estimatedG}g
                    </span>
                    {satisfied && (
                      <span className="text-[10px] opacity-70">
                        Slot {match.slotPosition}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Slots */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Slots da impressora
          </p>

          {effectiveSlots.map((slot) => {
            const spool = slot.effectiveSpool;
            const isSlotPersisting = persisting[slot.id] ?? false;
            const isScanningThisSlot = activeScanSlotId === slot.id;
            const flash = scanFlash[slot.id];
            const satisfiesReq = spool
              ? requirements.some((r) => spoolMatchesReq(spool, r))
              : false;
            const contextMaterial = getContextMaterialForSlot(slot.position);
            const options = buildSpoolOptions(
              availableSpools,
              requirements,
              contextMaterial,
            );
            const currentValue =
              assignments[slot.id] !== undefined
                ? (assignments[slot.id] ?? "__empty__")
                : (slot.currentSpool?.id ?? "__empty__");

            return (
              <div
                key={slot.id}
                className={cn(
                  "rounded-xl border p-3 space-y-2.5 transition-all duration-300",
                  flash === "ok"
                    ? "border-success bg-success/10 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                    : flash === "error"
                      ? "border-destructive bg-destructive/10 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                      : satisfiesReq
                        ? "border-success/30 bg-success/5"
                        : spool
                          ? "border-border bg-muted/10"
                          : "border-dashed border-border/50",
                )}
              >
                {/* Cabeçalho do slot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {slot.position}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {slot.unitName}
                    </span>
                    {flash === "ok" && (
                      <BadgeCheck
                        size={13}
                        className="text-success animate-in fade-in zoom-in duration-200"
                      />
                    )}
                    {flash === "error" && (
                      <TriangleAlert
                        size={13}
                        className="text-destructive animate-in fade-in zoom-in duration-200"
                      />
                    )}
                    {satisfiesReq && !flash && (
                      <CheckCircle2 size={11} className="text-success" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isSlotPersisting && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Loader2 size={9} className="animate-spin" />A
                        guardar...
                      </span>
                    )}
                    {/* Botão QR Scanner */}
                    <button
                      onClick={() =>
                        isScanningThisSlot
                          ? closeScanner()
                          : openScanner(slot.id)
                      }
                      disabled={isSlotPersisting}
                      title={
                        isScanningThisSlot
                          ? "Fechar scanner"
                          : "Ler QR Code do rolo"
                      }
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                        isScanningThisSlot
                          ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {isScanningThisSlot ? (
                        <>
                          <CameraOff size={11} /> Fechar
                        </>
                      ) : (
                        <>
                          <QrCode size={11} /> Scan
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Visor de câmara — aparece apenas no slot activo */}
                {isScanningThisSlot && (
                  <div className="rounded-lg overflow-hidden bg-black relative">
                    {/* Estado: a pedir permissão */}
                    {scanStatus === "requesting" && (
                      <div className="flex items-center justify-center gap-2 py-8 text-white text-xs">
                        <Loader2 size={14} className="animate-spin" />A aceder à
                        câmara...
                      </div>
                    )}
                    {/* Estado: erro de câmara */}
                    {scanStatus === "error" && (
                      <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
                        <CameraOff size={20} className="text-destructive" />
                        <p className="text-xs text-destructive">{scanError}</p>
                      </div>
                    )}
                    {/* Vídeo nativo (BarcodeDetector) */}
                    {"BarcodeDetector" in
                      (typeof window !== "undefined" ? window : {}) && (
                      <video
                        ref={videoRef}
                        className={cn(
                          "w-full max-h-48 object-cover",
                          scanStatus !== "scanning" && "hidden",
                        )}
                        playsInline
                        muted
                        autoPlay
                      />
                    )}
                    {/* Fallback: html5-qrcode renderiza no div com este id */}
                    {!(
                      "BarcodeDetector" in
                      (typeof window !== "undefined" ? window : {})
                    ) && (
                      <div
                        id="qr-scanner-video"
                        className={cn(
                          "w-full",
                          scanStatus !== "scanning" && "hidden",
                        )}
                      />
                    )}
                    {/* Overlay de mira */}
                    {scanStatus === "scanning" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-36 h-36 border-2 border-white/70 rounded-lg relative">
                          {/* Cantos animados */}
                          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl" />
                          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SearchableSelect */}
                <SearchableSelect
                  options={options}
                  value={currentValue}
                  onValueChange={(v) => handleSlotChange(slot.id, v)}
                  placeholder="Seleciona ou lê o QR Code do rolo..."
                  searchPlaceholder="ID (SPL-...), marca ou cor..."
                  disabled={isSlotPersisting || isScanningThisSlot}
                />

                {/* Hint contextual — material necessário */}
                {!satisfiesReq && contextMaterial && !spool && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <AlertTriangle size={8} className="text-warning" />
                    Necessário: {contextMaterial}
                    {requirements.find((r) => r.material === contextMaterial)
                      ?.colorName
                      ? ` ${requirements.find((r) => r.material === contextMaterial)?.colorName}`
                      : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Receita */}
        {batchSize > 1 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Receita
            </p>
            <div className="flex gap-2">
              {(["single", "full"] as const).map((r) => (
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
                    ? "Individual (1 un)"
                    : `Placa completa (×${batchSize})`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Acções */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={confirming}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!preflight.ok || confirming}
          >
            {confirming ? (
              "A iniciar..."
            ) : preflight.ok ? (
              <>
                <Zap size={13} className="mr-1.5" />
                Confirmar e Iniciar
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="mr-1.5" />
                {preflight.missing.length} requisito
                {preflight.missing.length > 1 ? "s" : ""} em falta
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// Verifica se algum slot da impressora tem uma bobine que requer adaptador
// (simplificado: usa requiresAdapter do componente vs bobine carregada)
function checkAdapterConflict(
  printer: PrinterType,
  part: PendingPart,
): { hasConflict: boolean; slotInfo: string } {
  if (!part.component.requiresAdapter)
    return { hasConflict: false, slotInfo: "" };

  // Verificar se algum slot tem filamento do material correto mas sem adaptador
  for (const unit of printer.units) {
    for (const slot of unit.slots) {
      if (!slot.currentSpool) continue;
      const spoolMaterial = slot.currentSpool.item.material;
      const needsMaterial = part.profile?.filaments[0]?.material;
      if (needsMaterial && spoolMaterial === needsMaterial) {
        return {
          hasConflict: true,
          slotInfo: `${unit.name} Slot ${slot.position + 1}`,
        };
      }
    }
  }
  return { hasConflict: false, slotInfo: "" };
}

// ─── PendingPartCard ──────────────────────────────────────────────────────────

function PendingPartCard({
  part,
  onDragStart,
  onSelect,
  selected,
}: {
  part: PendingPart;
  onDragStart: (part: PendingPart) => void;
  onSelect: (part: PendingPart) => void;
  selected: boolean;
}) {
  const c = useIntlayer("production");
  const profile = part.profile;

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
          <p className="text-[10px] text-muted-foreground font-mono">
            OP #{part.orderRef}
          </p>
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
          <span className="text-xs font-bold text-foreground">
            ×{part.quantityNeeded}
          </span>
        </div>
      </div>

      {profile && (
        <div className="flex items-center gap-2 flex-wrap">
          {profile.printTime && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={9} />
              {fmtTime(profile.printTime)}
            </span>
          )}
          {profile.filamentUsed && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Layers size={9} />
              {profile.filamentUsed}g
            </span>
          )}
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

// ─── PrinterDropZone ──────────────────────────────────────────────────────────

function PrinterDropZone({
  printer,
  selectedPart,
  onDrop,
}: {
  printer: PrinterType;
  selectedPart: PendingPart | null;
  onDrop: (printer: PrinterType, part: PendingPart) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const c = useIntlayer("production");

  const conflict = selectedPart
    ? checkAdapterConflict(printer, selectedPart)
    : { hasConflict: false, slotInfo: "" };

  const loadedSlots = printer.units.flatMap((u) =>
    u.slots.filter((s) => s.currentSpool !== null),
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (selectedPart) onDrop(printer, selectedPart);
      }}
      onClick={() => {
        if (selectedPart) onDrop(printer, selectedPart);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed transition-all p-4 space-y-3 cursor-pointer",
        dragOver || selectedPart
          ? conflict.hasConflict
            ? "border-amber-500/50 bg-amber-500/5"
            : "border-primary/50 bg-primary/5"
          : "border-border hover:border-primary/30",
        printer.status === "printing" && "opacity-60",
      )}
    >
      {/* Header da impressora */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Printer size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {printer.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {printer.preset.brand}{" "}
              {printer.preset.model ?? printer.preset.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              printer.status === "printing"
                ? "bg-emerald-500"
                : printer.status === "error"
                  ? "bg-red-500"
                  : "bg-muted-foreground/40",
            )}
          />
          <span className="text-[10px] text-muted-foreground capitalize">
            {printer.status === "printing"
              ? "A imprimir"
              : printer.status === "idle"
                ? "Disponível"
                : printer.status}
          </span>
        </div>
      </div>

      {/* Alerta de adaptador */}
      {conflict.hasConflict && selectedPart && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
          <AlertTriangle
            size={12}
            className="text-amber-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-[11px] text-amber-700">
            {c.planner.adapterWarning.value} — {conflict.slotInfo}
          </p>
        </div>
      )}

      {/* Slots carregados */}
      {printer.units.length > 0 && (
        <div className="space-y-1.5">
          {printer.units.map((unit) => (
            <div key={unit.id}>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                <Cpu size={9} />
                {unit.name}
              </p>
              <div className="flex gap-1 flex-wrap">
                {unit.slots.map((slot) => (
                  <div
                    key={slot.id}
                    title={
                      slot.currentSpool
                        ? `${slot.currentSpool.item.brand} ${slot.currentSpool.item.material} ${slot.currentSpool.item.colorName}`
                        : `Slot ${slot.position + 1} vazio`
                    }
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center text-[9px] font-bold",
                      slot.currentSpool
                        ? "border-transparent text-white"
                        : "border-dashed border-border text-muted-foreground/30",
                    )}
                    style={
                      slot.currentSpool
                        ? { backgroundColor: slot.currentSpool.item.colorHex }
                        : undefined
                    }
                  >
                    {slot.position + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      {selectedPart && !conflict.hasConflict && (
        <p className="text-[10px] text-primary text-center">
          Clica ou larga aqui para planear
        </p>
      )}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmPrintDialog({
  state,
  materialPriceMap,
  onConfirm,
  onCancel,
}: {
  state: ConfirmState;
  materialPriceMap: Record<string, number>;
  onConfirm: (recipe: "single" | "full") => void;
  onCancel: () => void;
}) {
  const c = useIntlayer("production");
  const { part, printer } = state;
  const profile = part.profile;
  const [recipe, setRecipe] = useState<"single" | "full">(state.recipe);
  const [loading, setLoading] = useState(false);

  const batchSize = profile?.batchSize ?? 1;
  const quantity = recipe === "full" ? batchSize : 1;

  const filamentCost =
    profile?.filaments.reduce((acc, f) => {
      const pricePerG = materialPriceMap[f.material] ?? 0.025;
      return acc + f.estimatedG * pricePerG;
    }, 0) ?? 0;

  const estimatedMinutes = profile?.printTime
    ? Math.round(profile.printTime * (recipe === "full" ? 1 : 1 / batchSize))
    : null;

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

          {/* Receita */}
          {batchSize > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                {c.planner.confirm.recipe.value}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecipe("single")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors",
                    recipe === "single"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {c.planner.confirm.single.value}
                </button>
                <button
                  onClick={() => setRecipe("full")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors",
                    recipe === "full"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {c.planner.confirm.fullPlate.value} (×{batchSize})
                </button>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unidades</span>
              <span className="font-medium text-foreground">{quantity}</span>
            </div>
            {estimatedMinutes && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {c.planner.confirm.estimatedTime.value}
                </span>
                <span className="font-medium text-foreground">
                  {fmtTime(estimatedMinutes)}
                </span>
              </div>
            )}
            {filamentCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Custo filamento</span>
                <span className="font-medium text-foreground">
                  €{filamentCost.toFixed(3)}
                </span>
              </div>
            )}
            {/* Filamentos */}
            {profile?.filaments && profile.filaments.length > 0 && (
              <div className="pt-1 border-t border-border flex flex-wrap gap-1.5">
                {profile.filaments.map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: f.colorHex ?? "#888" }}
                    />
                    <span className="text-muted-foreground">
                      {f.material} {f.estimatedG}g
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
            onClick={() => onConfirm(recipe)}
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

// ─── PlannerTab ───────────────────────────────────────────────────────────────

export function PlannerTab({
  orders,
  printers,
  materialPriceMap,
  onRefresh,
}: {
  orders: ProductionOrder[];
  printers: PrinterType[];
  materialPriceMap: Record<string, number>;
  onRefresh: () => void;
}) {
  const c = useIntlayer("production");
  const [dragging, setDragging] = useState<PendingPart | null>(null);
  const [selected, setSelected] = useState<PendingPart | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // Pre-flight state
  const [slotConfigOpen, setSlotConfigOpen] = useState(false);
  const [slotConfigPart, setSlotConfigPart] = useState<PendingPart | null>(
    null,
  );
  const [slotConfigPrinter, setSlotConfigPrinter] =
    useState<PrinterType | null>(null);
  const [availableSpools, setAvailableSpools] = useState<AvailableSpool[]>([]);

  // Extrair peças pendentes de todas as OPs ativas
  const pendingParts: PendingPart[] = [];
  for (const order of orders) {
    if (!["pending", "in_progress"].includes(order.status)) continue;
    for (const item of order.items) {
      for (const bomEntry of item.product.bom) {
        const component = bomEntry.component;
        const profile = component.profiles[0] ?? null;
        const alreadyAssigned = order.printJobs.some((j) =>
          j.items.some((ji) => ji.componentId === component.id),
        );
        if (!alreadyAssigned) {
          pendingParts.push({
            orderId: order.id,
            orderRef: order.reference,
            isUrgent: !!(order as any).saleId,
            component,
            profile,
            quantityNeeded: item.quantity * bomEntry.quantity,
          });
        }
      }
    }
  }

  // Ordenar: urgentes primeiro
  pendingParts.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return 0;
  });

  async function handleDrop(printer: PrinterType, part: PendingPart) {
    setDragging(null);
    setSelected(null);

    const requirements: FilamentReq[] = part.profile?.filaments ?? [];

    // Se não há requisitos de filamento, avançar directamente
    if (requirements.length === 0) {
      setConfirm({
        part,
        printer,
        recipe: (part.profile?.batchSize ?? 1) > 1 ? "full" : "single",
      });
      return;
    }

    // Pre-flight check com os slots actuais da impressora
    const allSlots = printer.units.flatMap((u) => u.slots);
    const preflight = runPreflightCheck(requirements, allSlots);

    if (preflight.ok) {
      // Tudo OK — mostrar dialog de confirmação normal
      setConfirm({
        part,
        printer,
        recipe: (part.profile?.batchSize ?? 1) > 1 ? "full" : "single",
      });
    } else {
      // Filamentos em falta — abrir modal de configuração de slots
      const missingList = preflight.missing
        .map((r) => `${r.material}${r.colorName ? ` ${r.colorName}` : ""}`)
        .join(", ");
      toast({
        title: "Filamento em falta nos slots",
        description: `Necessário: ${missingList}. Configura os slots para continuar.`,
        variant: "destructive",
      });

      // Carregar inventário de bobines (lazy)
      try {
        const res = await fetch(`${SITE_URL}/api/inventory`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableSpools(
            data.map((p: any) => ({
              id: p.id,
              qrCodeId: p.qrCodeId,
              currentWeight: p.currentWeight,
              initialWeight: p.initialWeight,
              item: p.item,
            })),
          );
        }
      } catch {}

      setSlotConfigPart(part);
      setSlotConfigPrinter(printer);
      setSlotConfigOpen(true);
    }
  }

  async function handleConfirm(recipe: "single" | "full") {
    if (!confirm) return;
    const { part, printer } = confirm;
    const batchSize = part.profile?.batchSize ?? 1;
    const quantity = recipe === "full" ? batchSize : 1;

    try {
      const res = await fetch(`${SITE_URL}/api/production/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          orderId: part.orderId,
          printerId: printer.id,
          componentId: part.component.id,
          profileId: part.profile?.id ?? null,
          quantity,
          recipe,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `Impressão lançada em ${printer.name}!` });
      setConfirm(null);
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  async function handleSlotConfigConfirm(
    slotAssignments: { slotId: string; spoolId: string | null }[],
    recipe: "single" | "full",
  ) {
    if (!slotConfigPart || !slotConfigPrinter) return;
    const part = slotConfigPart;
    const printer = slotConfigPrinter;
    const batchSize = part.profile?.batchSize ?? 1;
    const quantity = recipe === "full" ? batchSize : 1;

    try {
      // 1. Persistir slots na BD
      const slotRes = await fetch(
        `${SITE_URL}/api/printers/${printer.id}/slots`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify({ slots: slotAssignments }),
        },
      );
      if (!slotRes.ok) {
        const err = await slotRes.json();
        throw new Error(err.error ?? "Erro ao configurar slots");
      }

      // 2. Lançar o PrintJob
      const jobRes = await fetch(`${SITE_URL}/api/production/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          orderId: part.orderId,
          printerId: printer.id,
          componentId: part.component.id,
          profileId: part.profile?.id ?? null,
          quantity,
          recipe,
        }),
      });
      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error);

      toast({
        title: `✓ Slots configurados e impressão iniciada em ${printer.name}!`,
      });
      setSlotConfigOpen(false);
      setSlotConfigPart(null);
      setSlotConfigPrinter(null);
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {pendingParts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {c.planner.dragHint.value}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: peças pendentes */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {c.planner.pending.value}
            {pendingParts.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({pendingParts.length})
              </span>
            )}
          </h2>

          {pendingParts.length === 0 ? (
            <div className="border border-dashed rounded-xl py-10 text-center">
              <p className="text-xs text-muted-foreground">
                {c.planner.noPending.value}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {c.planner.noPendingDesc.value}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {pendingParts.map((part, i) => (
                <PendingPartCard
                  key={`${part.orderId}-${part.component.id}-${i}`}
                  part={part}
                  onDragStart={setDragging}
                  onSelect={(p) =>
                    setSelected((prev) =>
                      prev?.component.id === p.component.id ? null : p,
                    )
                  }
                  selected={selected?.component.id === part.component.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Colunas direitas: impressoras */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Impressoras
            {printers.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({printers.length})
              </span>
            )}
          </h2>

          {printers.length === 0 ? (
            <div className="border border-dashed rounded-xl py-10 text-center">
              <p className="text-xs text-muted-foreground">
                {c.planner.noprinters.value}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {c.planner.noPrintersDesc.value}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {printers.map((printer) => (
                <PrinterDropZone
                  key={printer.id}
                  printer={printer}
                  selectedPart={selected ?? dragging}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog — pre-flight passou */}
      {confirm && (
        <ConfirmPrintDialog
          state={confirm}
          materialPriceMap={materialPriceMap}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Slot config modal — pre-flight falhou */}
      <SlotConfigModal
        open={slotConfigOpen}
        part={slotConfigPart}
        printer={slotConfigPrinter}
        availableSpools={availableSpools}
        onConfirm={handleSlotConfigConfirm}
        onClose={() => {
          setSlotConfigOpen(false);
          setSlotConfigPart(null);
          setSlotConfigPrinter(null);
        }}
      />
    </div>
  );
}
