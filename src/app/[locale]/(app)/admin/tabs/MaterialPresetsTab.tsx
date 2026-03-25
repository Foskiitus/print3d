"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Plus, Trash2, Search } from "lucide-react";
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
import type { GlobalFilament } from "../AdminPageClient";

function NewFilamentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (f: GlobalFilament) => void;
}) {
  const c = useIntlayer("global-filaments");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorCode: "",
    colorHex: "#000000",
    spoolWeight: "1000",
    density: "",
  });

  function reset() {
    setForm({
      brand: "",
      material: "",
      colorName: "",
      colorCode: "",
      colorHex: "#000000",
      spoolWeight: "1000",
      density: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand.trim() || !form.material.trim() || !form.colorName.trim()) {
      toast({
        title: "Marca, material e nome da cor são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/global-filaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          brand: form.brand.trim(),
          material: form.material.trim(),
          colorName: form.colorName.trim(),
          colorCode: form.colorCode.trim() || null,
          colorHex: form.colorHex,
          spoolWeight: Number(form.spoolWeight) || 1000,
          density: form.density ? Number(form.density) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.created.value });
      reset();
      onOpenChange(false);
      onCreated(data);
    } catch (e: any) {
      toast({
        title: c.toast.createError.value,
        description: e.message,
        variant: "destructive",
      });
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
          <DialogTitle>{c.dialog.title.value}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{c.dialog.fields.brand.value}</Label>
              <Input
                placeholder="ex: Bambu Lab"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{c.dialog.fields.material.value}</Label>
              <Input
                placeholder="ex: PLA"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{c.dialog.fields.colorName.value}</Label>
              <Input
                placeholder="ex: Bambu Black"
                value={form.colorName}
                onChange={(e) =>
                  setForm({ ...form, colorName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Código da cor{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                placeholder="ex: 11101"
                value={form.colorCode}
                onChange={(e) =>
                  setForm({ ...form, colorCode: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cor (hex)</Label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-10 h-9 p-1 rounded cursor-pointer border border-border"
                value={form.colorHex}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
              />
              <Input
                value={form.colorHex}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Peso do carretel (g)</Label>
              <Input
                type="number"
                min="100"
                value={form.spoolWeight}
                onChange={(e) =>
                  setForm({ ...form, spoolWeight: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Densidade (g/cm³){" "}
                <span className="text-muted-foreground font-normal text-[10px]">
                  (opcional)
                </span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="ex: 1.24"
                value={form.density}
                onChange={(e) => setForm({ ...form, density: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading
                ? c.dialog.submitting.value
                : c.dialog.submitButton.value}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialPresetsTab({
  initialFilaments,
}: {
  initialFilaments: GlobalFilament[];
}) {
  const c = useIntlayer("global-filaments");
  const [filaments, setFilaments] = useState(initialFilaments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");

  const materials = [...new Set(filaments.map((f) => f.material))].sort();

  const filtered = filaments.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.brand.toLowerCase().includes(q) ||
      f.colorName.toLowerCase().includes(q) ||
      (f.colorCode ?? "").toLowerCase().includes(q);
    const matchMaterial = !filterMaterial || f.material === filterMaterial;
    return matchSearch && matchMaterial;
  });

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este filamento global?")) return;
    try {
      const res = await fetch(`/api/global-filaments/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      setFilaments((prev) => prev.filter((f) => f.id !== id));
      toast({ title: c.toast.deleted.value });
    } catch {
      toast({ title: c.toast.deleteError.value, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 w-44 text-sm"
            />
          </div>
          <select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="">Todos os materiais</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} filamentos
          </span>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={13} className="mr-1.5" />
          {c.dialog.triggerButton.value}
        </Button>
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Marca",
                  "Material",
                  "Cor",
                  "Código",
                  "Peso",
                  "Densidade",
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground text-sm"
                  >
                    {c.table.empty.value}
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {f.brand}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {f.material}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                          style={{ backgroundColor: f.colorHex }}
                        />
                        <span className="text-muted-foreground text-xs">
                          {f.colorName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {f.colorCode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {f.spoolWeight}g
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {f.density ? `${f.density} g/cm³` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(f.id)}
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

      <NewFilamentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(f) => setFilaments((prev) => [...prev, f])}
      />
    </div>
  );
}
