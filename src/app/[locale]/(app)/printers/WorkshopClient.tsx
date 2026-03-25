"use client";

import { useState } from "react";
import { Plus, Printer, Settings2, Cpu, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrinterCard } from "@/components/products/PrinterCard";
import { AddPrinterDialog } from "@/components/forms/AddPrinterDialog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnitPreset {
  id: string;
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
}

export interface PrinterPreset {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  powerWatts: number;
  hourlyCost: number;
  imageUrl: string | null;
}

export interface SlotSpool {
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

export interface PrinterSlot {
  id: string;
  position: number;
  loadedAt: string | null;
  currentSpool: SlotSpool | null;
}

export interface PrinterUnit {
  id: string;
  name: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  unitPreset: UnitPreset | null;
  slots: PrinterSlot[];
}

export interface PrinterData {
  id: string;
  name: string;
  status: string;
  hourlyCost: number;
  powerWatts: number;
  totalPrintTime: number;
  acquiredAt: string | null;
  preset: PrinterPreset;
  units: PrinterUnit[];
  maintenanceLogs: { createdAt: string; taskName: string }[];
}

interface WorkshopClientProps {
  initialPrinters: PrinterData[];
  printerPresets: PrinterPreset[];
  unitPresets: UnitPreset[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkshopClient({
  initialPrinters,
  printerPresets,
  unitPresets,
}: WorkshopClientProps) {
  const [printers, setPrinters] = useState<PrinterData[]>(initialPrinters);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = async () => {
    const res = await fetch(`${SITE_URL}/api/printers`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    });
    if (res.ok) setPrinters(await res.json());
  };

  const totalSlots = printers.reduce(
    (acc, p) => acc + p.units.reduce((a, u) => a + u.slotCount, 0),
    0,
  );
  const loadedSlots = printers.reduce(
    (acc, p) =>
      acc +
      p.units.reduce(
        (a, u) => a + u.slots.filter((s) => s.currentSpool !== null).length,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            A Minha Oficina
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestão das tuas máquinas e sistemas de alimentação de filamento.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          Adicionar Impressora
        </Button>
      </div>

      {/* Stats rápidas */}
      {printers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Impressoras"
            value={printers.length}
            icon={Printer}
          />
          <StatCard
            label="Online"
            value={printers.filter((p) => p.status === "printing").length}
            icon={Settings2}
            highlight
          />
          <StatCard label="Slots totais" value={totalSlots} icon={Cpu} />
          <StatCard
            label="Slots carregados"
            value={`${loadedSlots}/${totalSlots}`}
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* Grid de impressoras */}
      {printers.length === 0 ? (
        <div className="border border-dashed rounded-xl py-20 text-center">
          <Printer
            size={36}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-muted-foreground">
            Ainda não tens impressoras configuradas.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            Adiciona a tua primeira máquina para começar a planear produções.
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Adicionar Impressora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {printers.map((printer) => (
            <PrinterCard
              key={printer.id}
              printer={printer}
              unitPresets={unitPresets}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Dialog de adicionar */}
      <AddPrinterDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        printerPresets={printerPresets}
        unitPresets={unitPresets}
        onCreated={refresh}
      />
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon
          size={13}
          className={
            highlight ? "text-emerald-500" : "text-muted-foreground/40"
          }
        />
      </div>
      <p
        className={`text-2xl font-bold ${highlight ? "text-emerald-500" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
