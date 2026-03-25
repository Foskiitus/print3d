"use client";

import { useState } from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import type { Platform } from "../SettingsPageClient";

const PLATFORM_EXAMPLES = [
  { name: "Etsy", commission: 6.5, fixedFee: 0.2 },
  { name: "Shopify", commission: 2.0, fixedFee: 0.3 },
  { name: "Amazon Handmade", commission: 15.0, fixedFee: 0 },
  { name: "Venda Direta", commission: 0, fixedFee: 0 },
];

export function PlatformsSection({
  userId,
  initialPlatforms,
}: {
  userId: string;
  initialPlatforms: Platform[];
}) {
  const c = useIntlayer("settings");
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [form, setForm] = useState({ name: "", commission: "", fixedFee: "" });
  const [saving, setSaving] = useState(false);

  async function savePlatforms(updated: Platform[]) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({
        settings: { sale_platforms: JSON.stringify(updated) },
      }),
    });
    if (!res.ok) throw new Error("Falha ao guardar");
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    const newPlatform: Platform = {
      id: Date.now().toString(),
      name: form.name.trim(),
      commission: Number(form.commission) || 0,
      fixedFee: Number(form.fixedFee) || 0,
    };
    const updated = [...platforms, newPlatform];
    try {
      await savePlatforms(updated);
      setPlatforms(updated);
      setForm({ name: "", commission: "", fixedFee: "" });
      toast({ title: c.platforms.toast.saved.value });
    } catch (e: any) {
      toast({
        title: c.platforms.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const updated = platforms.filter((p) => p.id !== id);
    try {
      await savePlatforms(updated);
      setPlatforms(updated);
      toast({ title: c.platforms.toast.deleted.value });
    } catch {
      toast({ title: c.platforms.toast.error.value, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">
        {c.platforms.heading.value}
      </h2>

      {/* Exemplos rápidos */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {c.platforms.examples.value}
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              onClick={() =>
                setForm({
                  name: ex.name,
                  commission: String(ex.commission),
                  fixedFee: String(ex.fixedFee),
                })
              }
              className="px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>{c.platforms.name.value}</Label>
            <Input
              placeholder="Etsy"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{c.platforms.commission.value}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="6.5"
              value={form.commission}
              onChange={(e) => setForm({ ...form, commission: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{c.platforms.fixedFee.value}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.20"
              value={form.fixedFee}
              onChange={(e) => setForm({ ...form, fixedFee: e.target.value })}
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={saving || !form.name.trim()}
        >
          <Plus size={13} className="mr-1.5" />
          {c.platforms.addButton.value}
        </Button>
      </div>

      {/* Lista */}
      {platforms.length === 0 ? (
        <div className="border border-dashed rounded-xl py-10 text-center">
          <Globe size={28} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {c.platforms.empty.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {c.platforms.emptyHint.value}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.commission}% comissão + €{p.fixedFee.toFixed(2)} fixo
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
