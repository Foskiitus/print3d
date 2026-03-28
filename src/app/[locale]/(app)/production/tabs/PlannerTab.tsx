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

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/toaster";
import { useIntlayer } from "next-intlayer";
import type {
  ProductionOrder,
  Printer as PrinterType,
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
  filterPrinterId,
  filterOrderId: filterOrderIdProp,
}: {
  orders: ProductionOrder[];
  printers: PrinterType[];
  materialPriceMap: Record<string, number>;
  onRefresh: () => void;
  // Foca numa impressora específica (vindo da página da impressora)
  filterPrinterId?: string;
  // Foca numa OP específica (vindo do botão "Imprimir Pendentes" na OrdersTab)
  filterOrderId?: string;
}) {
  const c = useIntlayer("production");
  // filterOrderId pode vir como prop (URL) ou via evento (botão da OrdersTab)
  const [filterOrderId, setFilterOrderId] = useState<string | undefined>(
    filterOrderIdProp,
  );

  // Ouvir evento disparado pelo botão "Imprimir Pendentes" / "Resolver Falhas"
  useEffect(() => {
    function handleSwitchTab(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.orderId) setFilterOrderId(detail.orderId);
    }
    window.addEventListener("production:switch-tab", handleSwitchTab);
    return () =>
      window.removeEventListener("production:switch-tab", handleSwitchTab);
  }, []);

  const [dragging, setDragging] = useState<PendingPart | null>(null);
  const [selected, setSelected] = useState<PendingPart | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // Perfil seleccionado por componente — key: "{orderId}-{componentId}"
  // Permite ao utilizador escolher qual perfil usar quando o componente tem múltiplos
  const [selectedProfiles, setSelectedProfiles] = useState<
    Record<string, string>
  >({});

  // Pre-flight state
  const [slotConfigOpen, setSlotConfigOpen] = useState(false);
  const [slotConfigPart, setSlotConfigPart] = useState<PendingPart | null>(
    null,
  );
  const [slotConfigPrinter, setSlotConfigPrinter] =
    useState<PrinterType | null>(null);
  const [availableSpools, setAvailableSpools] = useState<AvailableSpool[]>([]);

  // Impressora em foco (quando filterPrinterId está definido)
  const focusedPrinter = filterPrinterId
    ? (printers.find((p) => p.id === filterPrinterId) ?? null)
    : null;

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
        // Usar o perfil seleccionado pelo utilizador, ou o primeiro por defeito
        const partKey = `${order.id}-${component.id}`;
        const selectedProfileId = selectedProfiles[partKey];
        const profile = selectedProfileId
          ? (component.profiles.find((p: any) => p.id === selectedProfileId) ??
            component.profiles[0] ??
            null)
          : (component.profiles[0] ?? null);
        const quantityNeeded = item.quantity * bomEntry.quantity;
        const batchSize = profile?.batchSize ?? 1;
        const totalPrints = Math.ceil(quantityNeeded / batchSize);

        // Contar quantos jobs foram lançados com sucesso para este componente.
        // Jobs "failed" NÃO contam — a mesa falhou e precisa de ser re-impressa.
        // Jobs "cancelled" também não contam.
        // Só "printing", "pending" e "done" bloqueiam o aparecimento do card.
        const launchedJobs = order.printJobs.filter(
          (j) =>
            ["pending", "printing", "done"].includes(j.status) &&
            j.items.some((ji: any) => ji.componentId === component.id),
        );
        const launchedCount = launchedJobs.length;

        // Calcular unidades já produzidas com sucesso para este componente
        // (jobs done, descontando failedUnits)
        const successUnits = order.printJobs
          .filter(
            (j) =>
              j.status === "done" &&
              j.items.some((ji: any) => ji.componentId === component.id),
          )
          .reduce((sum, j) => {
            const item = j.items.find(
              (ji: any) => ji.componentId === component.id,
            );
            return (
              sum +
              Math.max(0, (item?.quantity ?? 0) - (item?.failedUnits ?? 0))
            );
          }, 0);

        // Quantas mesas ainda faltam (tendo em conta o que já foi produzido com sucesso)
        const remainingUnits = Math.max(0, quantityNeeded - successUnits);
        const totalPrintsRemaining = Math.ceil(remainingUnits / batchSize);

        // Gerar um card por mesa ainda não lançada (incluindo retries de mesas falhadas)
        // printIndex começa no número de jobs activos/concluídos (não falhados)
        for (
          let printIndex = launchedCount;
          printIndex < launchedCount + totalPrintsRemaining;
          printIndex++
        ) {
          // Última mesa pode produzir menos se a quantidade não for múltiplo de batchSize
          const remainderUnits = remainingUnits % batchSize;
          const isLastPrint =
            printIndex === launchedCount + totalPrintsRemaining - 1;
          const unitsThisPrint =
            isLastPrint && remainderUnits > 0 ? remainderUnits : batchSize;

          pendingParts.push({
            orderId: order.id,
            orderRef: order.reference,
            isUrgent: !!(order as any).salesOrderId,
            component,
            profile,
            quantityNeeded,
            batchSize,
            printIndex,
            totalPrints: launchedCount + totalPrintsRemaining, // total real (inclui retries)
            unitsThisPrint,
          });
        }
      }
    }
  }

  // Mudar perfil de um card específico
  function handleProfileChange(part: PendingPart, profileId: string) {
    const partKey = `${part.orderId}-${part.component.id}`;
    setSelectedProfiles((prev) => ({ ...prev, [partKey]: profileId }));
    // Se o card estava seleccionado, limpar para evitar estado inconsistente
    if (
      selected?.orderId === part.orderId &&
      selected?.component.id === part.component.id
    ) {
      setSelected(null);
    }
  }

  // Ordenar: urgentes primeiro
  pendingParts.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return 0;
  });

  // Filtrar cards por impressora (foco de impressora)
  const partsFilteredByPrinter = focusedPrinter
    ? pendingParts.filter((part) => {
        const profilePresetId = (part.profile as any)?.printerPresetId ?? null;
        if (!profilePresetId) return true;
        return profilePresetId === focusedPrinter.preset?.id;
      })
    : pendingParts;

  // Filtrar cards por OP (vindo do botão "Imprimir Pendentes" / "Resolver Falhas")
  const visibleParts = filterOrderId
    ? partsFilteredByPrinter.filter((part) => part.orderId === filterOrderId)
    : partsFilteredByPrinter;

  // OP em foco (para mostrar banner)
  const focusedOrder = filterOrderId
    ? (orders.find((o) => o.id === filterOrderId) ?? null)
    : null;

  // Quando o utilizador clica num card no modo foco, usa a impressora filtrada
  // directamente em vez de precisar de drag-and-drop
  async function handleCardClickFocused(part: PendingPart) {
    if (!focusedPrinter) return;
    await handleDrop(focusedPrinter, part);
  }

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

    // O modal de slots abre SEMPRE — o utilizador confirma explicitamente
    // qual spool vai em cada slot antes de lançar, independentemente do preflight.

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
      {/* Banner de foco numa OP específica */}
      {focusedOrder && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
          <p className="text-xs text-destructive font-medium">
            A mostrar pendentes da OP{" "}
            <span className="font-semibold">#{focusedOrder.reference}</span>
          </p>
          <button
            onClick={() => setFilterOrderId(undefined)}
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            ver todas
          </button>
        </div>
      )}

      {/* Banner de foco numa impressora específica */}
      {focusedPrinter && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          <p className="text-xs text-primary font-medium">
            A mostrar apenas peças compatíveis com{" "}
            <span className="font-semibold">{focusedPrinter.name}</span>
          </p>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {visibleParts.length} de {pendingParts.length} peças
          </span>
        </div>
      )}

      {!focusedPrinter && visibleParts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {c.planner.dragHint.value}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: peças pendentes */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {c.planner.pending.value}
            {visibleParts.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({visibleParts.length})
              </span>
            )}
          </h2>

          {visibleParts.length === 0 ? (
            <div className="border border-dashed rounded-xl py-10 text-center">
              <p className="text-xs text-muted-foreground">
                {focusedPrinter
                  ? "Sem peças pendentes compatíveis com esta impressora."
                  : c.planner.noPending.value}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {focusedPrinter
                  ? "Os perfis dos componentes pendentes são para outro modelo."
                  : c.planner.noPendingDesc.value}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {visibleParts.map((part) => (
                <PendingPartCard
                  key={`${part.orderId}-${part.component.id}-${part.printIndex}`}
                  part={part}
                  onDragStart={focusedPrinter ? () => {} : setDragging}
                  onSelect={(p) => {
                    if (focusedPrinter) {
                      // Modo foco: clicar no card abre directamente o modal desta impressora
                      handleCardClickFocused(p);
                    } else {
                      setSelected((prev) =>
                        prev?.component.id === p.component.id ? null : p,
                      );
                    }
                  }}
                  selected={
                    !focusedPrinter &&
                    selected?.component.id === part.component.id
                  }
                  onProfileChange={(profileId) =>
                    handleProfileChange(part, profileId)
                  }
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

          {(() => {
            const visiblePrinters = focusedPrinter
              ? [focusedPrinter]
              : printers;
            if (visiblePrinters.length === 0) {
              return (
                <div className="border border-dashed rounded-xl py-10 text-center">
                  <p className="text-xs text-muted-foreground">
                    {c.planner.noprinters.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {c.planner.noPrintersDesc.value}
                  </p>
                </div>
              );
            }
            return (
              <div
                className={
                  focusedPrinter
                    ? "space-y-3"
                    : "grid grid-cols-1 sm:grid-cols-2 gap-3"
                }
              >
                {visiblePrinters.map((printer) => (
                  <PrinterDropZone
                    key={printer.id}
                    printer={printer}
                    selectedPart={
                      focusedPrinter ? null : (selected ?? dragging)
                    }
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            );
          })()}
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
