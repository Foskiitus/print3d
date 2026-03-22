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
import { toast } from "@/components/ui/toaster";
import { Plus } from "lucide-react";
import { useIntlayer } from "next-intlayer";

export function CustomerDialog({ onCreated }: { onCreated: () => void }) {
  const c = useIntlayer("dialogs");
  const d = c.customer;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    nif: "",
    notes: "",
  });

  const reset = () =>
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      nif: "",
      notes: "",
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          nif: form.nif.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || d.errorToast.value);
      toast({ title: d.successToast.value });
      reset();
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          {d.triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{d.dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">{d.name}</Label>
            <Input
              id="name"
              placeholder={d.namePlaceholder.value}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">
                {d.email}{" "}
                <span className="text-muted-foreground font-normal">
                  ({c.common.optional})
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={d.emailPlaceholder.value}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                {d.phone}{" "}
                <span className="text-muted-foreground font-normal">
                  ({c.common.optional})
                </span>
              </Label>
              <Input
                id="phone"
                placeholder={d.phonePlaceholder.value}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nif">
                {d.nif}{" "}
                <span className="text-muted-foreground font-normal">
                  ({c.common.optional})
                </span>
              </Label>
              <Input
                id="nif"
                placeholder={d.nifPlaceholder.value}
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">
                {d.address}{" "}
                <span className="text-muted-foreground font-normal">
                  ({c.common.optional})
                </span>
              </Label>
              <Input
                id="address"
                placeholder={d.addressPlaceholder.value}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              {d.notes}{" "}
              <span className="text-muted-foreground font-normal">
                ({c.common.optional})
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder={d.notesPlaceholder.value}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {c.common.cancel}
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              {loading ? d.submitting : d.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
