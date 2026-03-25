"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Trash2, PlusCircle } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

type GlobalFilament = {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorHex: string | null;
};

export function GlobalFilamentsClient({
  filaments: initial,
}: {
  filaments: GlobalFilament[];
}) {
  const router = useRouter();
  const c = useIntlayer("global-filaments");
  const [filaments, setFilaments] = useState(initial);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#000000",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/global-filaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const novo = await res.json();
      setFilaments((prev) => [...prev, novo]);
      setOpen(false);
      setForm({ brand: "", material: "", colorName: "", colorHex: "#000000" });
      toast({ title: c.toast.created });
      router.refresh();
    } catch {
      toast({ title: c.toast.createError, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza?")) return;
    try {
      const res = await fetch(`/api/global-filaments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setFilaments((prev) => prev.filter((f) => f.id !== id));
      toast({ title: c.toast.deleted });
      router.refresh();
    } catch {
      toast({ title: c.toast.deleteError, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {c.page.heading}
          </h1>
          <p className="text-muted-foreground">{c.page.description}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle size={16} />
              {c.dialog.triggerButton}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{c.dialog.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label>{c.dialog.fields.brand}</Label>
                <Input
                  required
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{c.dialog.fields.material}</Label>
                <Input
                  required
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{c.dialog.fields.colorName}</Label>
                  <Input
                    required
                    value={form.colorName}
                    onChange={(e) =>
                      setForm({ ...form, colorName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{c.dialog.fields.colorCode}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 p-1 cursor-pointer"
                      value={form.colorHex}
                      onChange={(e) =>
                        setForm({ ...form, colorHex: e.target.value })
                      }
                    />
                    <Input
                      required
                      value={form.colorHex}
                      onChange={(e) =>
                        setForm({ ...form, colorHex: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? c.dialog.submitting : c.dialog.submitButton}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{c.table.brand}</th>
                <th className="px-4 py-3 font-medium">{c.table.material}</th>
                <th className="px-4 py-3 font-medium">{c.table.color}</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filaments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {c.table.empty}
                  </td>
                </tr>
              ) : (
                filaments.map((filament) => (
                  <tr
                    key={filament.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{filament.brand}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{filament.material}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {filament.colorHex && (
                          <div
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: filament.colorHex }}
                          />
                        )}
                        <span>{filament.colorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(filament.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
