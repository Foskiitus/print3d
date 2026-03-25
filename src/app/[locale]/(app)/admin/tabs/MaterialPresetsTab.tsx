"use client";

import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { useIntlayer } from "next-intlayer";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function MaterialPresetsTab({
  filaments,
  onUpdate,
}: {
  filaments: GlobalFilament[];
  onUpdate: (f: GlobalFilament[]) => void;
}) {
  const c = useIntlayer("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#3b82f6",
    colorCode: "",
    spoolWeight: "1000",
  });

  const filtered = filaments.filter((f) => {
    const q = search.toLowerCase();
    return (
      !q ||
      f.brand.toLowerCase().includes(q) ||
      f.material.toLowerCase().includes(q) ||
      f.colorName.toLowerCase().includes(q)
    );
  });

  function reset() {
    setForm({
      brand: "",
      material: "",
      colorName: "",
      colorHex: "#3b82f6",
      colorCode: "",
      spoolWeight: "1000",
    });
  }

  async function handleCreate() {
    if (!form.brand.trim() || !form.material.trim() || !form.colorName.trim())
      return;
    setLoading(true);
    try {
      const res = await fetch(`${SITE_URL}/api/global-filaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          brand: form.brand.trim(),
          material: form.material.trim(),
          colorName: form.colorName.trim(),
          colorHex: form.colorHex,
          colorCode: form.colorCode.trim() || null,
          spoolWeight: Number(form.spoolWeight) || 1000,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate([...filaments, data]);
      toast({ title: c.globalFilaments.toast.created.value });
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({
        title: c.globalFilaments.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este filamento?")) return;
    try {
      const res = await fetch(`${SITE_URL}/api/global-filaments/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      onUpdate(filaments.filter((f) => f.id !== id));
      toast({ title: c.globalFilaments.toast.deleted.value });
    } catch {
      toast({
        title: c.globalFilaments.toast.error.value,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8"
          />
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          {c.globalFilaments.addButton.value}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                c.globalFilaments.brand.value,
                c.globalFilaments.material.value,
                c.globalFilaments.colorName.value,
                c.globalFilaments.spoolWeight.value,
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {c.globalFilaments.empty.value}
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
                    <Badge variant="outline">{f.material}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: f.colorHex }}
                      />
                      <span className="text-muted-foreground text-xs">
                        {f.colorName}
                      </span>
                      {f.colorCode && (
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                          {f.colorCode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {f.spoolWeight}g
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive"
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
            <DialogTitle>{c.globalFilaments.dialogTitle.value}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{c.globalFilaments.brand.value}</Label>
                <Input
                  placeholder="Bambu Lab"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{c.globalFilaments.material.value}</Label>
                <Input
                  placeholder="PLA"
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{c.globalFilaments.colorName.value}</Label>
              <Input
                placeholder="Bambu Green"
                value={form.colorName}
                onChange={(e) =>
                  setForm({ ...form, colorName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{c.globalFilaments.colorHex.value}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.colorHex}
                    onChange={(e) =>
                      setForm({ ...form, colorHex: e.target.value })
                    }
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-1"
                  />
                  <Input
                    value={form.colorHex}
                    onChange={(e) =>
                      setForm({ ...form, colorHex: e.target.value })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{c.globalFilaments.spoolWeight.value}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.spoolWeight}
                  onChange={(e) =>
                    setForm({ ...form, spoolWeight: e.target.value })
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
                  ? c.globalFilaments.submitting.value
                  : c.globalFilaments.submit.value}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
