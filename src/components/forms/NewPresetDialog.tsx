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
import { Plus } from "lucide-react";

export function NewPresetDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hourlyCost: "",
    powerWatts: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.hourlyCost || !form.powerWatts) return;

    setLoading(true);
    try {
      const res = await fetch("/api/printers/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          hourlyCost: Number(form.hourlyCost),
          powerWatts: Number(form.powerWatts),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast({ title: "Preset criado!" });
      setForm({ name: "", hourlyCost: "", powerWatts: "" });
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
        <Button size="sm" variant="outline">
          <Plus size={14} className="mr-1.5" />
          Novo Preset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Preset Global</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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

          {form.powerWatts && (
            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Estimativa elétrica
              </p>
              <p>
                A <strong>0.20€/kWh</strong>:{" "}
                <strong>
                  {((Number(form.powerWatts) / 1000) * 0.2).toFixed(4)}€/h
                </strong>
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A criar..." : "Criar Preset Global"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
