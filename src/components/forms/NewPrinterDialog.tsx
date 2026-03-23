"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import {
  Plus,
  ShieldCheck,
  Lock,
  Zap,
  Euro,
  Cpu,
  Calendar,
  Clock,
  Search,
  Layers,
  ChevronRight,
  Trash2,
  Thermometer,
  Wrench,
  X,
  PenLine,
  Check,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrinterPreset {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  extrusionType?: string;
  multiMaterialSlots: number;
  powerWatts: number;
  hourlyCost: number;
  isGlobal: boolean;
}

interface UnitPreset {
  id: string;
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  notes?: string;
}

interface PendingUnit {
  key: string;
  presetId: string;
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
}

interface Props {
  presets: PrinterPreset[];
  unitPresets: UnitPreset[];
  onCreated: () => void;
}

// ─── Inline Preset Creator ────────────────────────────────────────────────────
// Aparece quando o utilizador não encontra o modelo no catálogo.
// Cria um preset privado via API e seleciona-o automaticamente.

function InlinePresetCreator({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName: string;
  onCreated: (preset: PrinterPreset) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    model: initialName,
    extrusionType: "Direct" as "Direct" | "Bowden",
    powerWatts: "",
    hourlyCost: "",
  });

  async function handleSave() {
    if (!form.brand || !form.model || !form.powerWatts || !form.hourlyCost)
      return;
    setSaving(true);
    try {
      const res = await fetch("/api/printers/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          name: `${form.brand} ${form.model}`,
          extrusionType: form.extrusionType,
          multiMaterialSlots: 1,
          powerWatts: Number(form.powerWatts),
          hourlyCost: Number(form.hourlyCost),
          isGlobal: false, // sempre privado quando criado inline
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar preset");
      toast({ title: `Preset "${data.name}" criado e selecionado` });
      onCreated(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PenLine size={12} className="text-primary" />
          <span className="text-xs font-semibold text-primary">
            Novo modelo privado
          </span>
        </div>
        <button type="button" onClick={onCancel}>
          <X
            size={13}
            className="text-muted-foreground hover:text-foreground"
          />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Marca
          </Label>
          <Input
            placeholder="ex: Bambu Lab"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="h-7 text-xs"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Modelo
          </Label>
          <Input
            placeholder="ex: P2S"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Extrusão toggle */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Extrusão
          </Label>
          <div className="flex rounded-md overflow-hidden border border-border h-7">
            {(["Direct", "Bowden"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, extrusionType: t })}
                className={`flex-1 text-[10px] font-medium transition-colors ${
                  form.extrusionType === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Zap size={9} />W
          </Label>
          <Input
            type="number"
            placeholder="1000"
            value={form.powerWatts}
            onChange={(e) => setForm({ ...form, powerWatts: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Euro size={9} />
            €/h
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.15"
            value={form.hourlyCost}
            onChange={(e) => setForm({ ...form, hourlyCost: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Ficará guardado nos teus presets privados. Podes adicionar tarefas de
        manutenção mais tarde.
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 h-7 text-xs gap-1"
          disabled={
            saving ||
            !form.brand ||
            !form.model ||
            !form.powerWatts ||
            !form.hourlyCost
          }
          onClick={handleSave}
        >
          <Check size={11} />
          {saving ? "A guardar…" : "Criar e selecionar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Unit Picker ──────────────────────────────────────────────────────────────

function UnitPicker({
  unitPresets,
  onAdd,
}: {
  unitPresets: UnitPreset[];
  onAdd: (preset: UnitPreset) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return unitPresets;
    return unitPresets.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.brand.toLowerCase().includes(q),
    );
  }, [unitPresets, search]);

  const byBrand = useMemo(() => {
    const map = new Map<string, UnitPreset[]>();
    for (const u of filtered) {
      if (!map.has(u.brand)) map.set(u.brand, []);
      map.get(u.brand)!.push(u);
    }
    return map;
  }, [filtered]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-sm text-muted-foreground"
      >
        <Plus size={13} />
        Adicionar unidade de expansão
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Escolher unidade
        </span>
        <button type="button" onClick={() => setOpen(false)}>
          <X
            size={13}
            className="text-muted-foreground hover:text-foreground"
          />
        </button>
      </div>

      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Pesquisar AMS, MMU, ERCF…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-7 h-7 text-xs"
          autoFocus
        />
      </div>

      <div className="max-h-52 overflow-y-auto space-y-3 pr-0.5">
        {byBrand.size === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Sem resultados para "{search}"
          </p>
        )}
        {Array.from(byBrand.entries()).map(([brand, units]) => (
          <div key={brand} className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-0.5">
              {brand}
            </p>
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onAdd(u);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers
                    size={12}
                    className="text-muted-foreground flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {u.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {u.slotCount} slots
                      </span>
                      {u.supportsHighTemp && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                          <Thermometer size={9} />
                          alta temp
                        </span>
                      )}
                      {u.supportsAbrasive && (
                        <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                          <Wrench size={9} />
                          abrasivos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Plus
                  size={12}
                  className="text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0"
                />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NewPrinterDialog({ presets, unitPresets, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PrinterPreset | null>(
    null,
  );
  const [localPresets, setLocalPresets] = useState<PrinterPreset[]>(presets);
  const [pendingUnits, setPendingUnits] = useState<PendingUnit[]>([]);
  const [form, setForm] = useState({
    name: "",
    hourlyCost: "",
    powerWatts: "",
    acquiredAt: "",
    initialHours: "0",
  });

  // ── Pesquisa ──────────────────────────────────────────────────────────────
  const filteredPresets = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return localPresets;
    return localPresets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q) ||
        p.extrusionType?.toLowerCase().includes(q),
    );
  }, [localPresets, search]);

  const globalPresets = filteredPresets.filter((p) => p.isGlobal);
  const privatePresets = filteredPresets.filter((p) => !p.isGlobal);

  // Mostrar botão "criar modelo" quando a pesquisa não tem resultados
  const showCreateHint =
    search.trim().length > 0 && filteredPresets.length === 0;

  const totalSlots = pendingUnits.reduce((acc, u) => acc + u.slotCount, 0) || 1;

  // ── Selecionar preset ────────────────────────────────────────────────────
  const handlePresetSelect = (preset: PrinterPreset) => {
    if (selectedPreset?.id === preset.id) {
      setSelectedPreset(null);
      setForm((f) => ({ ...f, hourlyCost: "", powerWatts: "" }));
    } else {
      setSelectedPreset(preset);
      setShowInlineCreator(false);
      setForm((f) => ({
        ...f,
        hourlyCost: String(preset.hourlyCost),
        powerWatts: String(preset.powerWatts),
      }));
    }
  };

  // ── Preset criado inline ─────────────────────────────────────────────────
  const handleInlinePresetCreated = (preset: PrinterPreset) => {
    // Adicionar à lista local e selecionar automaticamente
    setLocalPresets((prev) => [...prev, preset]);
    setSelectedPreset(preset);
    setForm((f) => ({
      ...f,
      hourlyCost: String(preset.hourlyCost),
      powerWatts: String(preset.powerWatts),
    }));
    setShowInlineCreator(false);
    setSearch("");
  };

  // ── Gerir unidades ────────────────────────────────────────────────────────
  const handleAddUnit = (preset: UnitPreset) => {
    setPendingUnits((prev) => [
      ...prev,
      {
        key: `${preset.id}-${Date.now()}`,
        presetId: preset.id,
        name: preset.name,
        brand: preset.brand,
        slotCount: preset.slotCount,
        supportsHighTemp: preset.supportsHighTemp,
        supportsAbrasive: preset.supportsAbrasive,
      },
    ]);
  };

  const handleRemoveUnit = (key: string) => {
    setPendingUnits((prev) => prev.filter((u) => u.key !== key));
  };

  // ── Reset ao fechar ───────────────────────────────────────────────────────
  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setForm({
        name: "",
        hourlyCost: "",
        powerWatts: "",
        acquiredAt: "",
        initialHours: "0",
      });
      setSelectedPreset(null);
      setPendingUnits([]);
      setSearch("");
      setShowInlineCreator(false);
      setLocalPresets(presets);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.hourlyCost || !form.powerWatts || !selectedPreset)
      return;

    setLoading(true);
    try {
      const res = await fetch("/api/printers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          hourlyCost: Number(form.hourlyCost),
          powerWatts: Number(form.powerWatts),
          presetId: selectedPreset.id,
          acquiredAt: form.acquiredAt || null,
          initialHours: Number(form.initialHours ?? 0),
          units: pendingUnits.map(({ key, ...u }) => u),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast({ title: "Impressora adicionada com sucesso!" });
      handleOpenChange(false);
      onCreated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Preset Button ─────────────────────────────────────────────────────────
  const PresetButton = ({ preset }: { preset: PrinterPreset }) => {
    const isSelected = selectedPreset?.id === preset.id;
    return (
      <button
        type="button"
        onClick={() => handlePresetSelect(preset)}
        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors w-full group ${
          isSelected
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/40 hover:bg-muted/40"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {preset.isGlobal ? (
            <ShieldCheck
              size={12}
              className={
                isSelected
                  ? "text-primary flex-shrink-0"
                  : "text-muted-foreground flex-shrink-0"
              }
            />
          ) : (
            <Lock
              size={12}
              className={
                isSelected
                  ? "text-primary flex-shrink-0"
                  : "text-muted-foreground flex-shrink-0"
              }
            />
          )}
          <div className="min-w-0">
            <span
              className={`text-sm font-medium truncate block ${isSelected ? "text-primary" : "text-foreground"}`}
            >
              {preset.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {preset.extrusionType && (
                <span className="text-[10px] text-muted-foreground">
                  {preset.extrusionType}
                </span>
              )}
              {!preset.isGlobal && (
                <span className="text-[10px] text-muted-foreground">
                  · privado
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">
              {preset.powerWatts}W
            </p>
            <p className="text-[10px] text-muted-foreground">
              {preset.hourlyCost}€/h
            </p>
          </div>
          <ChevronRight
            size={12}
            className={`transition-colors ${isSelected ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
          />
        </div>
      </button>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          Nova Impressora
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Impressora</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* ── Passo 1: Modelo base ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Modelo Base
              </Label>
              {selectedPreset && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-primary border-primary/30 ml-auto"
                >
                  {selectedPreset.name}
                </Badge>
              )}
            </div>

            {/* Campo de pesquisa */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Pesquisar por marca, modelo…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowInlineCreator(false);
                }}
                className="pl-8 h-8 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setShowInlineCreator(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X
                    size={12}
                    className="text-muted-foreground hover:text-foreground"
                  />
                </button>
              )}
            </div>

            {/* Lista de resultados */}
            {!showInlineCreator && (
              <div className="max-h-44 overflow-y-auto space-y-3 pr-1">
                {filteredPresets.length === 0 && !search && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Sem presets disponíveis.
                  </p>
                )}

                {globalPresets.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck size={9} className="text-primary" />
                      Globais
                    </p>
                    {globalPresets.map((p) => (
                      <PresetButton key={p.id} preset={p} />
                    ))}
                  </div>
                )}

                {privatePresets.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Lock size={9} />
                      Os meus presets
                    </p>
                    {privatePresets.map((p) => (
                      <PresetButton key={p.id} preset={p} />
                    ))}
                  </div>
                )}

                {/* Botão "criar modelo" — aparece quando a pesquisa não tem resultados */}
                {showCreateHint && (
                  <div className="py-2 space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      Nenhum resultado para <strong>"{search}"</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowInlineCreator(true)}
                      className="flex items-center justify-center gap-1.5 w-full p-2 rounded-lg border border-dashed border-primary/40 hover:bg-primary/5 transition-colors text-xs text-primary font-medium"
                    >
                      <PenLine size={12} />
                      Criar "{search}" como preset privado
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Formulário inline de criação de preset */}
            {showInlineCreator && (
              <InlinePresetCreator
                initialName={search}
                onCreated={handleInlinePresetCreated}
                onCancel={() => setShowInlineCreator(false)}
              />
            )}

            {!showInlineCreator && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => setShowInlineCreator(true)}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase flex items-center gap-1"
                >
                  <PenLine size={9} />
                  criar novo modelo
                </button>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
          </div>

          {/* ── Passo 2: Unidades de expansão ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Unidades de Expansão
                </Label>
              </div>
              {pendingUnits.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {totalSlots} slot{totalSlots !== 1 ? "s" : ""} total
                </Badge>
              )}
            </div>

            {pendingUnits.length > 0 && (
              <div className="space-y-1.5">
                {pendingUnits.map((unit) => (
                  <div
                    key={unit.key}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers
                        size={12}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {unit.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {unit.slotCount} slots
                          </span>
                          {unit.supportsHighTemp && (
                            <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                              <Thermometer size={9} />
                              alta temp
                            </span>
                          )}
                          {unit.supportsAbrasive && (
                            <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                              <Wrench size={9} />
                              abrasivos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(unit.key)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <UnitPicker unitPresets={unitPresets} onAdd={handleAddUnit} />

            {pendingUnits.length === 0 && (
              <p className="text-[10px] text-muted-foreground">
                Sem unidades — a impressora usará 1 spool de cada vez.
              </p>
            )}
          </div>

          {/* ── Passo 3: A minha máquina ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                3
              </div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                A Minha Máquina
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <Cpu size={11} className="text-muted-foreground" />
                Nome Personalizado
              </Label>
              <Input
                id="name"
                placeholder='ex: "Besta de Carga 01"'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="hourlyCost"
                  className="flex items-center gap-1.5"
                >
                  <Euro size={11} className="text-muted-foreground" />
                  Custo Horário
                </Label>
                <Input
                  id="hourlyCost"
                  type="number"
                  step="0.01"
                  placeholder="0.50"
                  value={form.hourlyCost}
                  onChange={(e) =>
                    setForm({ ...form, hourlyCost: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="powerWatts"
                  className="flex items-center gap-1.5"
                >
                  <Zap size={11} className="text-muted-foreground" />
                  Consumo (W)
                </Label>
                <Input
                  id="powerWatts"
                  type="number"
                  placeholder="400"
                  value={form.powerWatts}
                  onChange={(e) =>
                    setForm({ ...form, powerWatts: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="acquiredAt"
                  className="flex items-center gap-1.5"
                >
                  <Calendar size={11} className="text-muted-foreground" />
                  Data de Aquisição
                </Label>
                <Input
                  id="acquiredAt"
                  type="date"
                  value={form.acquiredAt}
                  onChange={(e) =>
                    setForm({ ...form, acquiredAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="initialHours"
                  className="flex items-center gap-1.5"
                >
                  <Clock size={11} className="text-muted-foreground" />
                  Horas Iniciais
                </Label>
                <Input
                  id="initialHours"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.initialHours}
                  onChange={(e) =>
                    setForm({ ...form, initialHours: e.target.value })
                  }
                />
                <p className="text-[10px] text-muted-foreground">
                  Se usada, indica as horas já feitas.
                </p>
              </div>
            </div>

            {form.powerWatts && (
              <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground">
                  Estimativa Elétrica
                </p>
                <p>
                  A 0.20€/kWh:{" "}
                  <strong>
                    {((Number(form.powerWatts) / 1000) * 0.2).toFixed(4)}€/h
                  </strong>
                </p>
              </div>
            )}
          </div>

          {!selectedPreset && (
            <p className="text-[11px] text-amber-500 flex items-center gap-1">
              <ShieldCheck size={10} />
              Seleciona ou cria um modelo base para continuar.
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !form.name ||
              !form.hourlyCost ||
              !form.powerWatts ||
              !selectedPreset
            }
          >
            {loading ? "A criar…" : "Adicionar Impressora"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
