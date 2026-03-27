"use client";

import { useState } from "react";
import { Plus, Trash2, Warehouse } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import type { Location } from "../SettingsPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function LocationsSection({
  userId,
  initialLocations,
}: {
  userId: string;
  initialLocations: Location[];
}) {
  const c = useIntlayer("settings");
  const [locations, setLocations] = useState(initialLocations);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveLocations(updated: Location[]) {
    const res = await fetch(`${SITE_URL}/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({
        settings: { warehouse_locations: JSON.stringify(updated) },
      }),
    });
    if (!res.ok) throw new Error("Falha ao guardar");
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const newLocation: Location = {
      id: Date.now().toString(),
      name: name.trim(),
    };
    const updated = [...locations, newLocation];
    try {
      await saveLocations(updated);
      setLocations(updated);
      setName("");
      toast({ title: c.locations.toast.saved.value });
    } catch (e: any) {
      toast({
        title: c.locations.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const updated = locations.filter((l) => l.id !== id);
    try {
      await saveLocations(updated);
      setLocations(updated);
      toast({ title: c.locations.toast.deleted.value });
    } catch {
      toast({ title: c.locations.toast.error.value, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 card">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {c.locations.heading.value}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {c.locations.hint.value}
        </p>
      </div>

      {/* Adicionar */}
      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder={c.locations.namePlaceholder.value}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button size="sm" onClick={handleAdd} disabled={saving || !name.trim()}>
          <Plus size={13} className="mr-1" />
          {c.locations.addButton.value}
        </Button>
      </div>

      {/* Lista */}
      {locations.length === 0 ? (
        <div className="border border-dashed rounded-xl py-10 text-center">
          <Warehouse
            size={28}
            className="text-muted-foreground/30 mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {c.locations.empty.value}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-sm"
            >
              <span className="text-foreground">{loc.name}</span>
              <button
                onClick={() => handleDelete(loc.id)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
