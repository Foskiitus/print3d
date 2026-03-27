"use client";

import { useState } from "react";
import { Plus, Trash2, FileKey } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import type { License } from "../SettingsPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function LicensingSection({
  userId,
  initialLicenses,
}: {
  userId: string;
  initialLicenses: License[];
}) {
  const c = useIntlayer("settings");
  const [licenses, setLicenses] = useState(initialLicenses);
  const [form, setForm] = useState({
    name: "",
    monthlyCost: "",
    royaltyPerUnit: "",
  });
  const [saving, setSaving] = useState(false);

  async function saveLicenses(updated: License[]) {
    const res = await fetch(`${SITE_URL}/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({ settings: { licenses: JSON.stringify(updated) } }),
    });
    if (!res.ok) throw new Error("Falha ao guardar");
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    const newLicense: License = {
      id: Date.now().toString(),
      name: form.name.trim(),
      monthlyCost: Number(form.monthlyCost) || 0,
      royaltyPerUnit: Number(form.royaltyPerUnit) || 0,
    };
    const updated = [...licenses, newLicense];
    try {
      await saveLicenses(updated);
      setLicenses(updated);
      setForm({ name: "", monthlyCost: "", royaltyPerUnit: "" });
      toast({ title: c.licensing.toast.saved.value });
    } catch (e: any) {
      toast({
        title: c.licensing.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const updated = licenses.filter((l) => l.id !== id);
    try {
      await saveLicenses(updated);
      setLicenses(updated);
      toast({ title: c.licensing.toast.deleted.value });
    } catch {
      toast({ title: c.licensing.toast.error.value, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {c.licensing.heading.value}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {c.licensing.hint.value}
        </p>
      </div>

      {/* Formulário */}
      <div className="rounded-xl border border-border p-4 space-y-3 card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>{c.licensing.name.value}</Label>
            <Input
              placeholder="Patreon Criador X"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{c.licensing.monthlyCost.value}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="13.00"
              value={form.monthlyCost}
              onChange={(e) =>
                setForm({ ...form, monthlyCost: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{c.licensing.royaltyPerUnit.value}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="1.50"
              value={form.royaltyPerUnit}
              onChange={(e) =>
                setForm({ ...form, royaltyPerUnit: e.target.value })
              }
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={saving || !form.name.trim()}
        >
          <Plus size={13} className="mr-1.5" />
          {c.licensing.addButton.value}
        </Button>
      </div>

      {/* Lista */}
      {licenses.length === 0 ? (
        <div className="border border-dashed rounded-xl py-10 text-center card">
          <FileKey
            size={28}
            className="text-muted-foreground/30 mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {c.licensing.empty.value}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {licenses.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  €{l.monthlyCost.toFixed(2)}/mês · €
                  {l.royaltyPerUnit.toFixed(2)}/un royalty
                </p>
              </div>
              <button
                onClick={() => handleDelete(l.id)}
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
