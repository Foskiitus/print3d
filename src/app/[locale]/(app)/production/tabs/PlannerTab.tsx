"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type {
  ProductionOrder,
  Printer as PrinterType,
  Component,
  ComponentProfile,
  BOMEntry,
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
          {profile.filaments.slice(0, 3).map((f, i) => (
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

  function handleDrop(printer: PrinterType, part: PendingPart) {
    setDragging(null);
    setSelected(null);
    const conflict = checkAdapterConflict(printer, part);
    setConfirm({
      part,
      printer,
      recipe: (part.profile?.batchSize ?? 1) > 1 ? "full" : "single",
    });
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

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmPrintDialog
          state={confirm}
          materialPriceMap={materialPriceMap}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
