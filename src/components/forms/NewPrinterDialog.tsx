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
import { Plus, Monitor } from "lucide-react";

export function NewPrinterDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hourlyCost: "0.10",
    electricity: "200",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/printers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Impressora adicionada!" });
      setOpen(false);
      onCreated();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-2" /> Adicionar Impressora
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Impressora</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome da Máquina</Label>
            <Input
              placeholder="Ex: Bambu P1S"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Custo Horário (€/h)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.hourlyCost}
                onChange={(e) =>
                  setForm({ ...form, hourlyCost: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Consumo Médio (W)</Label>
              <Input
                type="number"
                value={form.electricity}
                onChange={(e) =>
                  setForm({ ...form, electricity: e.target.value })
                }
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Guardar Impressora
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
