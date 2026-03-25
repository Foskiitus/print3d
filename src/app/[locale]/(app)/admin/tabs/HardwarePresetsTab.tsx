"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import {
  Plus,
  Trash2,
  Printer,
  Cpu,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { PrinterPreset, UnitPreset } from "../AdminPageClient";

// ─── PrinterPresetDialog ──────────────────────────────────────────────────────

function PrinterPresetDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (preset: PrinterPreset) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    powerWatts: "250",
    hourlyCost: "0.50",
    extrusionType: "FDM",
    multiMaterialSlots: "1",
  });

  function reset() {
    setForm({
      name: "",
      brand: "",
      model: "",
      powerWatts: "250",
      hourlyCost: "0.50",
      extrusionType: "FDM",
      multiMaterialSlots: "1",
    });
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.brand.trim()) {
      toast({ title: "Nome e marca são obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/printer-presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim(),
          model: form.model.trim() || null,
          powerWatts: Number(form.powerWatts),
          hourlyCost: Number(form.hourlyCost),
          extrusionType: form.extrusionType || null,
          multiMaterialSlots: Number(form.multiMaterialSlots),
          isGlobal: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Preset criado!" });
      reset();
      onOpenChange(false);
      onCreated(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Preset de Impressora</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input
                placeholder="ex: Bambu Lab"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input
                placeholder="ex: P1S"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do preset</Label>
            <Input
              placeholder="ex: Bambu P1S"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Potência (W)</Label>
              <Input
                type="number"
                min="0"
                value={form.powerWatts}
                onChange={(e) =>
                  setForm({ ...form, powerWatts: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Custo/hora (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.hourlyCost}
                onChange={(e) =>
                  setForm({ ...form, hourlyCost: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de extrusão</Label>
              <select
                value={form.extrusionType}
                onChange={(e) =>
                  setForm({ ...form, extrusionType: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="FDM">FDM</option>
                <option value="CoreXY">CoreXY</option>
                <option value="Bedslinger">Bedslinger</option>
                <option value="Delta">Delta</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Slots multi-material</Label>
              <Input
                type="number"
                min="1"
                value={form.multiMaterialSlots}
                onChange={(e) =>
                  setForm({ ...form, multiMaterialSlots: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "A criar..." : "Criar Preset"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── UnitPresetDialog ─────────────────────────────────────────────────────────

function UnitPresetDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (preset: UnitPreset) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    slotCount: "4",
    supportsHighTemp: false,
    supportsAbrasive: false,
    notes: "",
  });

  function reset() {
    setForm({
      name: "",
      brand: "",
      slotCount: "4",
      supportsHighTemp: false,
      supportsAbrasive: false,
      notes: "",
    });
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.brand.trim()) {
      toast({ title: "Nome e marca são obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/unit-presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim(),
          slotCount: Number(form.slotCount),
          supportsHighTemp: form.supportsHighTemp,
          supportsAbrasive: form.supportsAbrasive,
          notes: form.notes.trim() || null,
          isGlobal: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Preset de AMS criado!" });
      reset();
      onOpenChange(false);
      onCreated(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo Preset de AMS / Acessório</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input
                placeholder="ex: Bambu Lab"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                placeholder="ex: AMS 2 Pro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Número de slots</Label>
            <Input
              type="number"
              min="1"
              max="32"
              value={form.slotCount}
              onChange={(e) => setForm({ ...form, slotCount: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.supportsHighTemp}
                onChange={(e) =>
                  setForm({ ...form, supportsHighTemp: e.target.checked })
                }
              />
              High Temp
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.supportsAbrasive}
                onChange={(e) =>
                  setForm({ ...form, supportsAbrasive: e.target.checked })
                }
              />
              Abrasivos
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>
              Notas{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              placeholder="..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "A criar..." : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── HardwarePresetsTab ───────────────────────────────────────────────────────

export function HardwarePresetsTab({
  initialPrinterPresets,
  initialUnitPresets,
}: {
  initialPrinterPresets: PrinterPreset[];
  initialUnitPresets: UnitPreset[];
}) {
  const [printerPresets, setPrinterPresets] = useState(initialPrinterPresets);
  const [unitPresets, setUnitPresets] = useState(initialUnitPresets);
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [showPrinters, setShowPrinters] = useState(true);
  const [showUnits, setShowUnits] = useState(true);

  async function handleDeletePrinter(id: string) {
    if (!confirm("Eliminar este preset?")) return;
    try {
      const res = await fetch(`/api/printer-presets/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      setPrinterPresets((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Preset eliminado" });
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  }

  async function handleDeleteUnit(id: string) {
    if (!confirm("Eliminar este preset?")) return;
    try {
      const res = await fetch(`/api/admin/unit-presets/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      setUnitPresets((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Preset eliminado" });
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Impressoras */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPrinters((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Printer size={14} className="text-muted-foreground" />
            Modelos de Impressora
            <span className="text-xs text-muted-foreground font-normal">
              ({printerPresets.length})
            </span>
            {showPrinters ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
          </button>
          <Button size="sm" onClick={() => setPrinterDialogOpen(true)}>
            <Plus size={13} className="mr-1.5" /> Adicionar Impressora
          </Button>
        </div>

        {showPrinters && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      "Marca",
                      "Modelo",
                      "Tipo",
                      "Watts",
                      "€/h",
                      "Slots MM",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {printerPresets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground text-sm"
                      >
                        Nenhum preset encontrado.
                      </td>
                    </tr>
                  ) : (
                    printerPresets.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {p.brand ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.model ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">
                            {p.extrusionType ?? "FDM"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.powerWatts}W
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          €{p.hourlyCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.multiMaterialSlots}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeletePrinter(p.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* AMS / Unidades */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowUnits((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Cpu size={14} className="text-muted-foreground" />
            Modelos de AMS / Acessórios
            <span className="text-xs text-muted-foreground font-normal">
              ({unitPresets.length})
            </span>
            {showUnits ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <Button size="sm" onClick={() => setUnitDialogOpen(true)}>
            <Plus size={13} className="mr-1.5" /> Adicionar AMS
          </Button>
        </div>

        {showUnits && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      "Marca",
                      "Nome",
                      "Slots",
                      "High Temp",
                      "Abrasivos",
                      "Notas",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unitPresets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground text-sm"
                      >
                        Nenhum preset encontrado.
                      </td>
                    </tr>
                  ) : (
                    unitPresets.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {u.brand}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.slotCount}
                        </td>
                        <td className="px-4 py-3">
                          {u.supportsHighTemp ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] text-amber-600 border-amber-500/30"
                            >
                              ✓
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.supportsAbrasive ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] text-amber-600 border-amber-500/30"
                            >
                              ✓
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.notes ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUnit(u.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <PrinterPresetDialog
        open={printerDialogOpen}
        onOpenChange={setPrinterDialogOpen}
        onCreated={(p) => setPrinterPresets((prev) => [...prev, p])}
      />
      <UnitPresetDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        onCreated={(u) => setUnitPresets((prev) => [...prev, u])}
      />
    </div>
  );
}
