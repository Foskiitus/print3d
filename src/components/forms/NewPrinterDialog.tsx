"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { Plus, ShieldCheck } from "lucide-react";

export function NewPrinterDialog({
  presets,
  onCreated,
}: {
  presets: any[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    hourlyCost: "",
    powerWatts: "",
  });

  const handlePresetSelect = (preset: any) => {
    if (selectedPreset?.id === preset.id) {
      // Desselecionar — limpar campos
      setSelectedPreset(null);
      setForm({ name: "", hourlyCost: "", powerWatts: "" });
    } else {
      // Selecionar preset — preencher campos automaticamente
      setSelectedPreset(preset);
      setForm({
        name: preset.name,
        hourlyCost: String(preset.hourlyCost),
        powerWatts: String(preset.powerWatts),
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.hourlyCost || !form.powerWatts) return;

    setLoading(true);
    try {
      const res = await fetch("/api/printers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          hourlyCost: Number(form.hourlyCost),
          powerWatts: Number(form.powerWatts),
          presetId: selectedPreset?.id ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast({ title: "Impressora adicionada!" });
      setForm({ name: "", hourlyCost: "", powerWatts: "" });
      setSelectedPreset(null);
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          Nova Impressora
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Impressora</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Presets disponíveis */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Escolher de preset global
              </Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {presets.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          size={13}
                          className={
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        />
                        <span className="text-sm font-medium">
                          {preset.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{preset.powerWatts}W</span>
                        <span>{preset.hourlyCost}€/h</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase">
                  ou personalizar
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          )}

          {/* Campos manuais — pré-preenchidos se preset selecionado */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome da impressora</Label>
            <Input
              id="name"
              placeholder="ex: Bambu X1C"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hourlyCost">Custo horário (€/h)</Label>
              <Input
                id="hourlyCost"
                type="number"
                step="0.01"
                placeholder="ex: 0.50"
                value={form.hourlyCost}
                onChange={(e) =>
                  setForm({ ...form, hourlyCost: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="powerWatts">Consumo (W)</Label>
              <Input
                id="powerWatts"
                type="number"
                placeholder="ex: 300"
                value={form.powerWatts}
                onChange={(e) =>
                  setForm({ ...form, powerWatts: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Preview custo elétrico */}
          {form.powerWatts && (
            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Estimativa elétrica</p>
              <p>
                A <strong>0.20€/kWh</strong>:{" "}
                <strong>
                  {((Number(form.powerWatts) / 1000) * 0.2).toFixed(4)}€/h
                </strong>
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A adicionar..." : "Adicionar Impressora"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
