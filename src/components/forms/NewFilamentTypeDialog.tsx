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

// ─── Input com sugestões dropdown ────────────────────────────────────────────
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

// ─── NewFilamentTypeDialog ────────────────────────────────────────────────────
export function NewFilamentTypeDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
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
    fetch("/api/filaments/presets")
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
        headers: { "Content-Type": "application/json" },
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
      toast({ title: "Material adicionado ao catálogo!" });
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
        title: "Erro",
        description: "Falha ao comunicar com a base de dados.",
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
          Novo Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Novo Filamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <SuggestInput
            label="Marca"
            value={form.brand}
            onChange={(v) => setForm((f) => ({ ...f, brand: v }))}
            suggestions={brandSuggestions}
            placeholder="Ex: Bambu Lab"
            required
          />

          <SuggestInput
            label="Material"
            value={form.material}
            onChange={(v) => setForm((f) => ({ ...f, material: v }))}
            suggestions={materialSuggestions}
            placeholder="Ex: PLA Basic, PETG, ASA"
            required
          />

          {/* Cores sugeridas pelo preset */}
          {colorSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Cores sugeridas</Label>
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
                Clica para preencher — ou define uma cor personalizada abaixo.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome/Código da Cor</Label>
              <Input
                placeholder="Ex: Preto"
                value={form.colorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colorName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cor Visual</Label>
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
              Alerta de stock mínimo (g){" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              type="number"
              min="0"
              placeholder="Padrão: 500g"
              value={form.alertThreshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, alertThreshold: e.target.value }))
              }
              {...numericInputProps()}
            />
            <p className="text-[10px] text-muted-foreground">
              Se não definires, usa 500g.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A processar..." : "Guardar no Catálogo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
