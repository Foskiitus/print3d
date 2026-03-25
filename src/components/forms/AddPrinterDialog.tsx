"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import {
  PrinterPreset,
  UnitPreset,
} from "@/app/[locale]/(app)/printers/WorkshopClient";

const AMS_PRESETS_SLOTS: Record<string, number> = {
  AMS: 4,
  "AMS 2 Pro": 4,
  "AMS Lite": 4,
  "AMS HT": 1,
  MMU3: 5,
  "ERCF V2 (8T)": 8,
  "ERCF V2 (12T)": 12,
  "Tradrack (8T)": 8,
  "Palette 3": 4,
  "Palette 3 Pro": 4,
};

interface AddPrinterDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  printerPresets: PrinterPreset[];
  unitPresets: UnitPreset[];
  onCreated: () => void;
}

interface AmsEntry {
  presetId: string;
  name: string;
  slotCount: number;
}

export function AddPrinterDialog({
  open,
  onOpenChange,
  printerPresets,
  unitPresets,
  onCreated,
}: AddPrinterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"printer" | "accessories">("printer");

  const [form, setForm] = useState({
    name: "",
    presetId: "",
    hourlyCost: "",
    powerWatts: "",
  });

  const [accessories, setAccessories] = useState<AmsEntry[]>([]);
  const [newAmsPresetId, setNewAmsPresetId] = useState("");

  const selectedPreset = printerPresets.find((p) => p.id === form.presetId);

  function resetForm() {
    setForm({ name: "", presetId: "", hourlyCost: "", powerWatts: "" });
    setAccessories([]);
    setNewAmsPresetId("");
    setStep("printer");
  }

  function handleAddAms() {
    const preset = unitPresets.find((p) => p.id === newAmsPresetId);
    if (!preset) return;
    setAccessories((prev) => [
      ...prev,
      {
        presetId: preset.id,
        name: preset.name,
        slotCount: preset.slotCount,
      },
    ]);
    setNewAmsPresetId("");
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.presetId) {
      toast({
        title: "Preenche o nome e seleciona o modelo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/printers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          presetId: form.presetId,
          hourlyCost: form.hourlyCost
            ? Number(form.hourlyCost)
            : (selectedPreset?.hourlyCost ?? 0.5),
          powerWatts: form.powerWatts
            ? Number(form.powerWatts)
            : (selectedPreset?.powerWatts ?? 250),
          accessories,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: `"${form.name}" adicionada com sucesso!` });
      resetForm();
      onOpenChange(false);
      onCreated();
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
        if (!v) resetForm();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Impressora</DialogTitle>
        </DialogHeader>

        {step === "printer" ? (
          <div className="space-y-4 mt-2">
            {/* Modelo */}
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <SearchableSelect
                options={printerPresets.map((p) => ({
                  value: p.id,
                  label: `${p.brand ?? ""} ${p.name}`.trim(),
                }))}
                value={form.presetId}
                onValueChange={(v) => {
                  const preset = printerPresets.find((p) => p.id === v);
                  setForm({
                    ...form,
                    presetId: v,
                    hourlyCost: preset?.hourlyCost?.toString() ?? "",
                    powerWatts: preset?.powerWatts?.toString() ?? "",
                  });
                }}
                placeholder="Seleciona o modelo..."
                searchPlaceholder="Pesquisar modelo..."
              />
            </div>

            {/* Nome personalizado */}
            <div className="space-y-1.5">
              <Label htmlFor="printer-name">Nome personalizado</Label>
              <Input
                id="printer-name"
                placeholder='ex: "P1S Alpha" ou "Mesa 3"'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>

            {/* Custos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hourly-cost">Custo/hora (€)</Label>
                <Input
                  id="hourly-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={selectedPreset?.hourlyCost?.toFixed(2) ?? "0.50"}
                  value={form.hourlyCost}
                  onChange={(e) =>
                    setForm({ ...form, hourlyCost: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="power-watts">Potência (W)</Label>
                <Input
                  id="power-watts"
                  type="number"
                  min="0"
                  placeholder={selectedPreset?.powerWatts?.toString() ?? "250"}
                  value={form.powerWatts}
                  onChange={(e) =>
                    setForm({ ...form, powerWatts: e.target.value })
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
                onClick={() => setStep("accessories")}
                disabled={!form.name.trim() || !form.presetId}
              >
                Seguinte →
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Quantos e quais os sistemas de alimentação de filamento tem a{" "}
              <strong className="text-foreground">{form.name}</strong>?
            </p>

            {/* Adicionar AMS */}
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={unitPresets.map((p) => ({
                    value: p.id,
                    label: `${p.brand} ${p.name} (${p.slotCount} slots)`,
                  }))}
                  value={newAmsPresetId}
                  onValueChange={setNewAmsPresetId}
                  placeholder="Seleciona acessório..."
                  searchPlaceholder="Pesquisar..."
                />
              </div>
              <Button
                variant="outline"
                onClick={handleAddAms}
                disabled={!newAmsPresetId}
              >
                + Adicionar
              </Button>
            </div>

            {/* Lista de acessórios adicionados */}
            {accessories.length > 0 ? (
              <div className="space-y-1.5">
                {accessories.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border"
                  >
                    <span className="text-sm font-medium">{a.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {a.slotCount} slots
                      </span>
                      <button
                        onClick={() =>
                          setAccessories((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground text-right">
                  Total: {accessories.reduce((a, b) => a + b.slotCount, 0)}{" "}
                  slots
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Sem acessórios — filamento direto (1 slot).
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("printer")}
              >
                ← Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "A criar..." : "Criar Impressora"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
