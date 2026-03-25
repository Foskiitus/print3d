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
import { UnitPreset } from "@/app/[locale]/(app)/printers/WorkshopClient";

interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  printerId: string;
  unitPresets: UnitPreset[];
  onCreated: () => void;
}

export function AddUnitDialog({
  open,
  onOpenChange,
  printerId,
  unitPresets,
  onCreated,
}: AddUnitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [presetId, setPresetId] = useState("");
  const [customName, setCustomName] = useState("");

  const selectedPreset = unitPresets.find((p) => p.id === presetId);

  function reset() {
    setPresetId("");
    setCustomName("");
  }

  async function handleSubmit() {
    if (!presetId) {
      toast({ title: "Seleciona um acessório", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/printers/${printerId}/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          presetId,
          name: customName.trim() || selectedPreset?.name || "AMS",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Acessório adicionado!" });
      reset();
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
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar AMS / Acessório</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Tipo de acessório</Label>
            <SearchableSelect
              options={unitPresets.map((p) => ({
                value: p.id,
                label: `${p.brand} ${p.name} (${p.slotCount} slots)`,
              }))}
              value={presetId}
              onValueChange={setPresetId}
              placeholder="Seleciona o acessório..."
              searchPlaceholder="Pesquisar..."
            />
          </div>

          {selectedPreset && (
            <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 space-y-1 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Slots:</strong>{" "}
                {selectedPreset.slotCount}
              </p>
              {selectedPreset.supportsHighTemp && (
                <p className="text-amber-600">⚠ Suporta materiais High Temp</p>
              )}
              {selectedPreset.supportsAbrasive && (
                <p className="text-amber-600">⚠ Suporta materiais abrasivos</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="unit-name">
              Nome personalizado{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              id="unit-name"
              placeholder={selectedPreset?.name ?? "ex: AMS Principal"}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
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
              disabled={loading || !presetId}
            >
              {loading ? "A adicionar..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
