"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import type { FinancialSettings } from "../SettingsPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "BRL"];

async function saveSettings(userId: string, patch: Record<string, string>) {
  const res = await fetch(`${SITE_URL}/api/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
    },
    body: JSON.stringify({ settings: patch }),
  });
  if (!res.ok) throw new Error("Falha ao guardar");
}

export function FinancialSection({
  userId,
  initialData,
}: {
  userId: string;
  initialData: FinancialSettings;
}) {
  const c = useIntlayer("settings");
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings(userId, {
        electricityPrice: String(data.kwhPrice),
        fixedCostPerProduct: String(data.fixedCostPerProduct),
        hourlyRate: String(data.hourlyRate),
        shippingCost: String(data.shippingCost),
        vatRate: String(data.vatRate),
        currency: data.currency,
      });
      toast({ title: c.financial.saved.value });
    } catch (e: any) {
      toast({
        title: c.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">
        {c.financial.heading.value}
      </h2>

      {/* Energia */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-1">
          {c.financial.energy.value}
        </h3>
        <div className="max-w-xs space-y-1.5">
          <Label>{c.financial.kwhPrice.value}</Label>
          <Input
            type="number"
            min="0"
            step="0.001"
            value={data.kwhPrice}
            onChange={(e) =>
              setData({ ...data, kwhPrice: Number(e.target.value) })
            }
          />
          <p className="text-[11px] text-muted-foreground">
            {c.financial.kwhHint.value}
          </p>
        </div>
      </section>

      {/* Pós-Processamento */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-1">
          {c.financial.postProcessing.value}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="space-y-1.5">
            <Label>{c.financial.fixedCost.value}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={data.fixedCostPerProduct}
              onChange={(e) =>
                setData({
                  ...data,
                  fixedCostPerProduct: Number(e.target.value),
                })
              }
            />
            <p className="text-[11px] text-muted-foreground">
              {c.financial.fixedCostHint.value}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>{c.financial.hourlyRate.value}</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={data.hourlyRate}
              onChange={(e) =>
                setData({ ...data, hourlyRate: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </section>

      {/* Logística */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-1">
          {c.financial.logistics.value}
        </h3>
        <div className="max-w-xs space-y-1.5">
          <Label>{c.financial.shippingCost.value}</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={data.shippingCost}
            onChange={(e) =>
              setData({ ...data, shippingCost: Number(e.target.value) })
            }
          />
        </div>
      </section>

      {/* Fiscalidade + Moeda */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-1">
          {c.financial.tax.value}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="space-y-1.5">
            <Label>{c.financial.vatRate.value}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={data.vatRate}
              onChange={(e) =>
                setData({ ...data, vatRate: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{c.financial.currency.value}</Label>
            <select
              value={data.currency}
              onChange={(e) => setData({ ...data, currency: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? c.financial.saving.value : c.financial.save.value}
      </Button>
    </div>
  );
}
