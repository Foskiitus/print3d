"use client";

import { useState } from "react";
import { Plus, Trash2, Cpu } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import type { PrinterPreset } from "../AdminPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function HardwarePresetsTab({
  presets,
  onUpdate,
}: {
  presets: PrinterPreset[];
  onUpdate: (p: PrinterPreset[]) => void;
}) {
  const c = useIntlayer("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    model: "",
    powerWatts: "250",
    hourlyCost: "0.50",
  });

  function reset() {
    setForm({ brand: "", model: "", powerWatts: "250", hourlyCost: "0.50" });
  }

  async function handleCreate() {
    if (!form.brand.trim() || !form.model.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${SITE_URL}/api/printer-presets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          brand: form.brand.trim(),
          model: form.model.trim(),
          powerWatts: Number(form.powerWatts),
          hourlyCost: Number(form.hourlyCost),
          isGlobal: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate([...presets, data]);
      toast({ title: c.printerPresets.toast.created.value });
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({
        title: c.printerPresets.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este preset?")) return;
    try {
      const res = await fetch(`${SITE_URL}/api/printer-presets/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      onUpdate(presets.filter((p) => p.id !== id));
      toast({ title: c.printerPresets.toast.deleted.value });
    } catch {
      toast({
        title: c.printerPresets.toast.error.value,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          {c.printerPresets.addButton.value}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                c.printerPresets.brand.value,
                c.printerPresets.model.value,
                c.printerPresets.powerWatts.value,
                c.printerPresets.hourlyCost.value,
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {presets.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {c.printerPresets.empty.value}
                </td>
              </tr>
            ) : (
              presets.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <Cpu size={13} className="text-muted-foreground" />
                    {p.brand}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.model}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.powerWatts}W
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    €{p.hourlyCost}/h
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{c.printerPresets.dialogTitle.value}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{c.printerPresets.brand.value}</Label>
                <Input
                  placeholder="Bambu Lab"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{c.printerPresets.model.value}</Label>
                <Input
                  placeholder="P1S"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{c.printerPresets.powerWatts.value}</Label>
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
                <Label>{c.printerPresets.hourlyCost.value}</Label>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading
                  ? c.printerPresets.submitting.value
                  : c.printerPresets.submit.value}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
