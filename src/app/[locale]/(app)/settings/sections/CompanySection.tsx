"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { Upload, Building2 } from "lucide-react";
import type { Company } from "../SettingsPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function CompanySection({
  userId,
  initialData,
}: {
  userId: string;
  initialData: Company;
}) {
  const c = useIntlayer("settings");
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${SITE_URL}/api/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ settings: { company: JSON.stringify(data) } }),
      });
      if (!res.ok) throw new Error("Falha ao guardar");
      toast({ title: c.company.saved.value });
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
        {c.company.heading.value}
      </h2>

      {/* Logo */}
      <section className="space-y-2">
        <Label>{c.company.logo.value}</Label>
        <div className="flex items-center gap-4">
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt="Logo"
              className="w-16 h-16 rounded-lg object-contain border border-border bg-muted/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
              <Building2 size={20} className="text-muted-foreground/30" />
            </div>
          )}
          <div>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/40 transition-colors">
              <Upload size={12} />
              {c.company.uploadLogo.value}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const signRes = await fetch(`${SITE_URL}/api/upload`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-key":
                        process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
                    },
                    body: JSON.stringify({
                      fileName: file.name,
                      contentType: file.type,
                      fileSize: file.size,
                      bucket: "images",
                    }),
                  });
                  if (!signRes.ok) return;
                  const { url, key } = await signRes.json();
                  await fetch(url, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                  });
                  setData({ ...data, logoUrl: key });
                }}
              />
            </label>
            <p className="text-[10px] text-muted-foreground mt-1">
              {c.company.logoHint.value}
            </p>
          </div>
        </div>
      </section>

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{c.company.name.value}</Label>
          <Input
            placeholder="SpoolIQ Studio"
            value={data.name ?? ""}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{c.company.vatId.value}</Label>
          <Input
            placeholder="PT123456789"
            value={data.vatId ?? ""}
            onChange={(e) => setData({ ...data, vatId: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{c.company.address.value}</Label>
          <Input
            placeholder="Rua Exemplo, 123, Lisboa"
            value={data.address ?? ""}
            onChange={(e) => setData({ ...data, address: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{c.company.email.value}</Label>
          <Input
            type="email"
            placeholder="geral@exemplo.pt"
            value={data.email ?? ""}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{c.company.phone.value}</Label>
          <Input
            placeholder="+351 910 000 000"
            value={data.phone ?? ""}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{c.company.website.value}</Label>
          <Input
            placeholder="https://exemplo.pt"
            value={data.website ?? ""}
            onChange={(e) => setData({ ...data, website: e.target.value })}
          />
        </div>
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? c.company.saving.value : c.company.save.value}
      </Button>
    </div>
  );
}
