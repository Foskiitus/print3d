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

export function NewPresetDialog({ onCreated }: { onCreated: () => void }) {
  const c = useIntlayer("dialogs");
  const d = c.preset;

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
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          name: form.name,
          hourlyCost: Number(form.hourlyCost),
          powerWatts: Number(form.powerWatts),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");
      toast({ title: d.successToast.value });
      setForm({ name: "", hourlyCost: "", powerWatts: "" });
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
        <Button size="sm" variant="outline">
          <Plus size={14} className="mr-1.5" />
          {d.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
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
            {loading ? c.common.creating : d.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
