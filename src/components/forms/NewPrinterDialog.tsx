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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { Plus, ShieldCheck } from "lucide-react";
import { useIntlayer } from "next-intlayer";

export function NewPrinterDialog({
  presets,
  onCreated,
}: {
  presets: any[];
  onCreated: () => void;
}) {
  const c = useIntlayer("dialogs");
  const d = c.printer;

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
      setSelectedPreset(null);
      setForm({ name: "", hourlyCost: "", powerWatts: "" });
    } else {
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
      toast({ title: d.successToast.value });
      setForm({ name: "", hourlyCost: "", powerWatts: "" });
      setSelectedPreset(null);
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast({
        title: c.common.error.value,
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
          {d.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {d.choosePreset}
              </Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {presets.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
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
                  {d.orCustomize}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">{d.printerName}</Label>
            <Input
              id="name"
              placeholder={d.printerNamePlaceholder.value}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hourlyCost">{d.hourlyCost}</Label>
              <Input
                id="hourlyCost"
                type="number"
                step="0.01"
                placeholder={d.hourlyCostPlaceholder.value}
                value={form.hourlyCost}
                onChange={(e) =>
                  setForm({ ...form, hourlyCost: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="powerWatts">{d.power}</Label>
              <Input
                id="powerWatts"
                type="number"
                placeholder={d.powerPlaceholder.value}
                value={form.powerWatts}
                onChange={(e) =>
                  setForm({ ...form, powerWatts: e.target.value })
                }
                required
              />
            </div>
          </div>
          {form.powerWatts && (
            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {d.electricalEstimate}
              </p>
              <p>
                {d.electricalAt}{" "}
                <strong>
                  {((Number(form.powerWatts) / 1000) * 0.2).toFixed(4)}€/h
                </strong>
              </p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? d.submitting : d.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
