"use client";
// src/app/[locale]/(app)/production/tabs/PlannerTab.tsx
//
// Componente principal do Planeador de Produção.
// Gera os cards de peças pendentes e gere o drag-and-drop para as impressoras.
//
// Subcomponentes (em ./planner/):
//   types.ts              — interfaces partilhadas
//   filament-helpers.ts   — lógica de compatibilidade de material/cor
//   planner-helpers.ts    — fmtTime, checkAdapterConflict
//   ReqRow.tsx            — linha de requisito no SlotConfigModal
//   SlotConfigModal.tsx   — modal de associação de spools a slots
//   PendingPartCard.tsx   — card arrastável de peça pendente
//   PrinterDropZone.tsx   — zona de drop de impressora
//   ConfirmPrintDialog.tsx — dialog de confirmação de lançamento

import { useState } from "react";
import { toast } from "@/components/ui/toaster";
import { useIntlayer } from "next-intlayer";
import { runPreflightCheck } from "@/lib/preflight";
import type {
  ProductionOrder,
  Printer as PrinterType,
  FilamentReq,
} from "../ProductionPageClient";

import {
  SITE_URL,
  type PendingPart,
  type ConfirmState,
  type AvailableSpool,
  type ProfilePlate,
} from "./planner/types";
import { PendingPartCard } from "./planner/PendingPartCard";
import { PrinterDropZone } from "./planner/PrinterDropZone";
import { ConfirmPrintDialog } from "./planner/ConfirmPrintDialog";
import { SlotConfigModal } from "./planner/SlotConfigModal";

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

  // Extrair peças pendentes de todas as OPs ativas.
  //
  // Lógica de yield:
  //   totalPrints = ceil(quantityNeeded / batchSize)
  //   Para cada mesa ainda não lançada como PrintJob, gerar 1 card.
  //   "Já lançada" = existe um PrintJob com este componentId cujo printIndex coincide.
  //
  // Exemplo: OP de 10 leões, batchSize=9 → totalPrints=2
  //   Se nenhum job lançado: 2 cards (Mesa 1/2 e Mesa 2/2)
  //   Se job da Mesa 1 lançado: 1 card (Mesa 2/2)
  //   Se ambos lançados: 0 cards
  const pendingParts: PendingPart[] = [];
  for (const order of orders) {
    if (!["pending", "in_progress"].includes(order.status)) continue;
    for (const item of order.items) {
      for (const bomEntry of item.product.bom) {
        const component = bomEntry.component;
        const profile = component.profiles[0] ?? null;
        const quantityNeeded = item.quantity * bomEntry.quantity;
        const batchSize = profile?.batchSize ?? 1;
        const totalPrints = Math.ceil(quantityNeeded / batchSize);

        // Contar quantos jobs já foram lançados para este componente nesta OP
        const launchedJobs = order.printJobs.filter((j) =>
          j.items.some((ji: any) => ji.componentId === component.id),
        );
        const launchedCount = launchedJobs.length;

        // Gerar um card por mesa ainda não lançada
        for (
          let printIndex = launchedCount;
          printIndex < totalPrints;
          printIndex++
        ) {
          // Última mesa pode produzir menos se a quantidade não for múltiplo de batchSize
          const isLastPrint = printIndex === totalPrints - 1;
          const remainder = quantityNeeded % batchSize;
          const unitsThisPrint =
            isLastPrint && remainder > 0 ? remainder : batchSize;

          pendingParts.push({
            orderId: order.id,
            orderRef: order.reference,
            isUrgent: !!(order as any).salesOrderId,
            component,
            profile,
            quantityNeeded,
            batchSize,
            printIndex,
            totalPrints,
            unitsThisPrint,
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

    const profile = part.profile;
    const batchSize = part.batchSize;
    // "full" = imprimir esta mesa completa (batchSize peças)
    // Para a última mesa com remainder, ainda é sempre "single" (1 corrida)
    const platesNeeded = 1; // cada card representa exactamente 1 mesa a lançar
    const defaultRecipe: "single" | "full" = "full";

    // Extrair placas do perfil (multi-mesa) ou criar placa única como fallback
    const profilePlates: ProfilePlate[] =
      (profile as any)?.plates?.length > 0
        ? (profile as any).plates
        : [
            {
              plateNumber: 1,
              name: null,
              printTime: profile?.printTime ?? null,
              batchSize: profile?.batchSize ?? 1,
              filaments: profile?.filaments ?? [],
            },
          ];

    const requirements: FilamentReq[] = part.profile?.filaments ?? [];

    if (requirements.length === 0) {
      setConfirm({
        part,
        printer,
        recipe: defaultRecipe,
        platesNeeded,
        profilePlates,
      });
      return;
    }

    const allSlots = printer.units.flatMap((u) => u.slots);
    const preflight = runPreflightCheck(requirements, allSlots);

    if (preflight.ok) {
      setConfirm({
        part,
        printer,
        recipe: defaultRecipe,
        platesNeeded,
        profilePlates,
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

  async function handleConfirm() {
    if (!confirm) return;
    const { part, printer, profilePlates } = confirm;

    // Cada card = 1 mesa → quantidade = unitsThisPrint (calculado no yield)
    const quantity = part.unitsThisPrint;
    // Tempo total desta mesa (1 corrida)
    const totalPlateMinutes = profilePlates.reduce(
      (s, p) => s + (p.printTime ?? 0),
      0,
    );
    const estimatedMinutes =
      totalPlateMinutes > 0 ? Math.round(totalPlateMinutes) : null;

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
          estimatedMinutes,
          printIndex: part.printIndex,
          totalPrints: part.totalPrints,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PRINTER_BUSY") {
          toast({
            title: "Impressora ocupada",
            description: `${printer.name} está a imprimir. Conclui ou cancela o job activo primeiro.`,
            variant: "destructive",
          });
          setConfirm(null);
          onRefresh(); // refrescar para actualizar estado da impressora
          return;
        }
        throw new Error(data.error);
      }
      toast({ title: `Impressão lançada em ${printer.name}!` });
      setConfirm(null);
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  async function handleSlotConfigConfirm(
    slotAssignments: { slotId: string; spoolId: string | null }[],
  ) {
    if (!slotConfigPart || !slotConfigPrinter) return;
    const part = slotConfigPart;
    const printer = slotConfigPrinter;
    // Each card = 1 mesa → quantity = unitsThisPrint
    const quantity = part.unitsThisPrint;
    const plates = 1;

    const profilePlates: ProfilePlate[] =
      (part.profile as any)?.plates?.length > 0
        ? (part.profile as any).plates
        : [
            {
              plateNumber: 1,
              name: null,
              printTime: part.profile?.printTime ?? null,
              batchSize: part.profile?.batchSize ?? 1,
              filaments: [],
            },
          ];

    const totalPlateMinutes = profilePlates.reduce(
      (s, p) => s + (p.printTime ?? 0),
      0,
    );
    const estimatedMinutes =
      totalPlateMinutes > 0 ? Math.round(totalPlateMinutes * plates) : null;

    try {
      // 1. Persistir slots na BD (só se houver alterações)
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
          estimatedMinutes,
          printIndex: part.printIndex,
          totalPrints: part.totalPrints,
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
                  key={`${part.orderId}-${part.component.id}-${part.printIndex}`}
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
