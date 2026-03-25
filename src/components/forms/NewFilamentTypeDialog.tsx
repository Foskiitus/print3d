"use client";

import { useState, useEffect, useRef } from "react";
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
import { toast } from "@/components/ui/toaster";
import { Plus } from "lucide-react";
import { ColorPicker } from "@/components/ui/colorPicker";
import { numericInputProps } from "@/lib/numericInput";
import { cn } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";

function SuggestInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
    .slice(0, 8);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-1.5" ref={ref}>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
        />
        {filtered.length > 0 && open && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NewFilamentTypeDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const c = useIntlayer("dialogs");
  const d = c.filamentType;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [form, setForm] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#3b82f6",
    alertThreshold: "",
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/filaments/presets", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setPresets(data) : setPresets([])))
      .catch(() => setPresets([]));
  }, [open]);

  const brandSuggestions = [...new Set(presets.map((p) => p.brand))].sort();
  const materialSuggestions = [
    ...new Set(
      presets
        .filter((p) => !form.brand || p.brand === form.brand)
        .map((p) => p.material),
    ),
  ].sort();
  const colorSuggestions = presets.filter(
    (p) =>
      (!form.brand || p.brand === form.brand) &&
      (!form.material || p.material === form.material),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand || !form.material || !form.colorName || !form.colorHex)
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/filaments/types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          brand: form.brand,
          material: form.material,
          colorHex: form.colorHex,
          colorName: form.colorName,
          alertThreshold: form.alertThreshold
            ? Number(form.alertThreshold)
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: d.newSuccess.value });
      setForm({
        brand: "",
        material: "",
        colorName: "",
        colorHex: "#3b82f6",
        alertThreshold: "",
      });
      setOpen(false);
      onCreated();
    } catch {
      toast({
        title: c.common.error.value,
        description: d.newError.value,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus size={14} className="mr-1.5" />
          {d.newTrigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{d.newTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <SuggestInput
            label={d.brand.value}
            value={form.brand}
            onChange={(v) => setForm((f) => ({ ...f, brand: v }))}
            suggestions={brandSuggestions}
            placeholder={d.brandPlaceholder.value}
            required
          />
          <SuggestInput
            label={d.material.value}
            value={form.material}
            onChange={(v) => setForm((f) => ({ ...f, material: v }))}
            suggestions={materialSuggestions}
            placeholder={d.materialPlaceholder.value}
            required
          />

          {colorSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <Label>{d.suggestedColors}</Label>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/30 rounded-lg border border-border max-h-32 overflow-y-auto">
                {colorSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        brand: p.brand,
                        material: p.material,
                        colorName: p.colorName,
                        colorHex: p.colorHex,
                      }))
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all",
                      form.colorName === p.colorName &&
                        form.colorHex === p.colorHex
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-accent",
                    )}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: p.colorHex,
                        boxShadow: `0 0 4px ${p.colorHex}88`,
                      }}
                    />
                    {p.colorName}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {d.suggestedColorsSub}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{d.colorName}</Label>
              <Input
                placeholder={d.colorNamePlaceholder.value}
                value={form.colorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colorName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{d.colorVisual}</Label>
              <div className="flex gap-2">
                <ColorPicker
                  value={form.colorHex}
                  onChange={(color) =>
                    setForm((f) => ({ ...f, colorHex: color }))
                  }
                />
                <div
                  className="flex-1 rounded-lg border flex items-center justify-center text-[10px] font-mono uppercase"
                  style={{
                    backgroundColor: form.colorHex,
                    boxShadow: `0 0 10px ${form.colorHex}`,
                    color: "#fff",
                    textShadow: "0 0 2px #000",
                  }}
                >
                  {form.colorHex}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {d.alertThreshold}{" "}
              <span className="text-muted-foreground font-normal">
                ({c.common.optional})
              </span>
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={d.alertThresholdPlaceholder.value}
              value={form.alertThreshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, alertThreshold: e.target.value }))
              }
              {...numericInputProps()}
            />
            <p className="text-[10px] text-muted-foreground">
              {d.alertThresholdSub}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? d.newSubmitting : d.newSubmit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
