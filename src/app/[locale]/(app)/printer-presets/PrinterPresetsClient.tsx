"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Trash2, PlusCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type GlobalPrinter = {
  id: string;
  brand: string;
  model: string;
};

export function PrinterPresetsClient({
  printers: initial,
}: {
  printers: GlobalPrinter[];
}) {
  const router = useRouter();
  const c = useIntlayer("printer-presets");
  const [printers, setPrinters] = useState(initial);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    model: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${SITE_URL}/api/printer-presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const nova = await res.json();
      setPrinters((prev) => [...prev, nova]);
      setOpen(false);
      setForm({ brand: "", model: "" });
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
      const res = await fetch(`${SITE_URL}/api/printer-presets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setPrinters((prev) => prev.filter((p) => p.id !== id));
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
                  placeholder="Ex: Bambu Lab"
                />
              </div>
              <div className="grid gap-2">
                <Label>{c.dialog.fields.model}</Label>
                <Input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Ex: P1S"
                />
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
                <th className="px-4 py-3 font-medium">{c.table.model}</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {printers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {c.table.empty}
                  </td>
                </tr>
              ) : (
                printers.map((printer) => (
                  <tr
                    key={printer.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Printer size={16} className="text-muted-foreground" />
                      {printer.brand}
                    </td>
                    <td className="px-4 py-3">{printer.model}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(printer.id)}
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
