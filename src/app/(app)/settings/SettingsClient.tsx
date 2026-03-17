"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Tag,
  Package,
  Zap,
  Check,
  Lock,
  Sun,
  Moon,
  Droplets,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewCategoryDialog } from "@/components/forms/NewCategoryDialog";
import { NewExtraDialog } from "@/components/forms/NewExtraDialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/colorPicker";

export function SettingsClient({
  initialCategories,
  initialExtras,
  initialElectricityPrice,
  initialUploadLimitMb,
  isAdmin,
}: {
  initialCategories: any[];
  initialExtras: any[];
  initialElectricityPrice: number;
  initialUploadLimitMb: number;
  isAdmin: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [extras, setExtras] = useState(initialExtras);
  const [electricityPrice, setElectricityPrice] = useState(
    String(initialElectricityPrice),
  );
  const [savingElectricity, setSavingElectricity] = useState(false);
  const [uploadLimitMb, setUploadLimitMb] = useState(
    String(initialUploadLimitMb),
  );
  const [savingUploadLimit, setSavingUploadLimit] = useState(false);

  const { theme, setTheme } = useTheme();

  // ── Presets de filamentos (admin) ──
  const [filamentPresets, setFilamentPresets] = useState<any[]>([]);
  const [newPreset, setNewPreset] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#3b82f6",
  });
  const [savingPreset, setSavingPreset] = useState(false);

  const loadPresets = async () => {
    const res = await fetch("/api/filaments/presets");
    if (res.ok) setFilamentPresets(await res.json());
  };

  // Carregar presets automaticamente se admin
  const [presetsInitialized, setPresetsInitialized] = useState(false);
  if (isAdmin && !presetsInitialized) {
    setPresetsInitialized(true);
    loadPresets();
  }

  const handleAddPreset = async () => {
    if (
      !newPreset.brand.trim() ||
      !newPreset.material.trim() ||
      !newPreset.colorName.trim()
    )
      return;
    setSavingPreset(true);
    try {
      const res = await fetch("/api/filaments/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Preset adicionado!" });
      setNewPreset({
        brand: "",
        material: "",
        colorName: "",
        colorHex: "#3b82f6",
      });
      loadPresets();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm("Eliminar este preset?")) return;
    try {
      const res = await fetch(`/api/filaments/presets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({ title: "Preset eliminado" });
      loadPresets();
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  };

  const refreshCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  };

  const refreshExtras = async () => {
    const res = await fetch("/api/extras");
    if (res.ok) setExtras(await res.json());
  };

  const handleSaveElectricity = async () => {
    const value = Number(electricityPrice);
    if (isNaN(value) || value < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSavingElectricity(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "electricityPrice", value: String(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Preço de eletricidade guardado!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingElectricity(false);
    }
  };

  const handleSaveUploadLimit = async () => {
    const value = Number(uploadLimitMb);
    if (isNaN(value) || value < 1 || value > 500) {
      toast({
        title: "Valor inválido. Deve estar entre 1 e 500 MB.",
        variant: "destructive",
      });
      return;
    }
    setSavingUploadLimit(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "uploadLimitMb", value: String(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Limite de upload guardado!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingUploadLimit(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Eliminar esta categoria? Os produtos associados ficarão sem categoria.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Categoria eliminada" });
      refreshCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!confirm("Eliminar este extra?")) return;
    try {
      const res = await fetch(`/api/extras/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Extra eliminado" });
      refreshExtras();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Preferências Pessoais ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-muted-foreground" />
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Preferências Pessoais
          </h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Configurações individuais — cada utilizador define os seus próprios
          valores.
        </p>

        <Card>
          <CardContent className="p-5 space-y-5">
            {/* Tema */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-foreground">
                  Tema da interface
                </p>
                <p className="text-xs text-muted-foreground">
                  Escolhe entre o modo escuro e claro. A preferência é guardada
                  no browser.
                </p>
              </div>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      theme === t
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground",
                    )}
                  >
                    {t === "dark" ? (
                      <>
                        <Moon size={14} /> Escuro
                      </>
                    ) : (
                      <>
                        <Sun size={14} /> Claro
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Preço da eletricidade */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-foreground">
                  Preço da eletricidade
                </p>
                <p className="text-xs text-muted-foreground">
                  Usado para calcular o custo de energia em cada produção. O
                  valor padrão é 0.20€/kWh.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={electricityPrice}
                    onChange={(e) => setElectricityPrice(e.target.value)}
                    className="w-28 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    €/kWh
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveElectricity}
                  disabled={savingElectricity}
                >
                  {savingElectricity ? (
                    "A guardar..."
                  ) : (
                    <>
                      <Check size={13} className="mr-1.5" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Configurações da Plataforma (admin) ── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Configurações da Plataforma
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              Admin
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Configurações globais que afetam todos os utilizadores da
            plataforma.
          </p>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-foreground">
                    Limite de upload de ficheiros
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamanho máximo permitido para ficheiros .3mf e .stl. Máximo
                    absoluto: 500 MB.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="500"
                      value={uploadLimitMb}
                      onChange={(e) => setUploadLimitMb(e.target.value)}
                      className="w-28 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      MB
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveUploadLimit}
                    disabled={savingUploadLimit}
                  >
                    {savingUploadLimit ? (
                      "A guardar..."
                    ) : (
                      <>
                        <Check size={13} className="mr-1.5" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Presets de Filamentos (admin) ── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Presets de Filamentos
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              Admin
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {filamentPresets.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Lista global de marcas, materiais e cores disponíveis como sugestões
            ao registar filamentos.
          </p>

          {/* Formulário */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-semibold text-foreground">
                Adicionar preset
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Marca</label>
                  <input
                    className="flex h-8 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Ex: Bambu Lab"
                    value={newPreset.brand}
                    onChange={(e) =>
                      setNewPreset((p) => ({ ...p, brand: e.target.value }))
                    }
                    list="preset-brands"
                  />
                  <datalist id="preset-brands">
                    {[...new Set(filamentPresets.map((p) => p.brand))].map(
                      (b) => (
                        <option key={b as string} value={b as string} />
                      ),
                    )}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Material
                  </label>
                  <input
                    className="flex h-8 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Ex: PLA Basic"
                    value={newPreset.material}
                    onChange={(e) =>
                      setNewPreset((p) => ({ ...p, material: e.target.value }))
                    }
                    list="preset-materials"
                  />
                  <datalist id="preset-materials">
                    {[...new Set(filamentPresets.map((p) => p.material))].map(
                      (m) => (
                        <option key={m as string} value={m as string} />
                      ),
                    )}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Nome da cor
                  </label>
                  <input
                    className="flex h-8 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Ex: Preto"
                    value={newPreset.colorName}
                    onChange={(e) =>
                      setNewPreset((p) => ({ ...p, colorName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Cor visual
                  </label>
                  <div className="flex gap-2">
                    <ColorPicker
                      value={newPreset.colorHex}
                      onChange={(color) =>
                        setNewPreset((p) => ({ ...p, colorHex: color }))
                      }
                    />
                    <div
                      className="flex-1 rounded-lg border flex items-center justify-center text-[10px] font-mono uppercase"
                      style={{
                        backgroundColor: newPreset.colorHex,
                        boxShadow: `0 0 8px ${newPreset.colorHex}`,
                        color: "#fff",
                        textShadow: "0 0 2px #000",
                      }}
                    >
                      {newPreset.colorHex}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleAddPreset}
                disabled={
                  savingPreset ||
                  !newPreset.brand.trim() ||
                  !newPreset.material.trim() ||
                  !newPreset.colorName.trim()
                }
              >
                <Plus size={13} className="mr-1.5" />
                {savingPreset ? "A adicionar..." : "Adicionar Preset"}
              </Button>
            </CardContent>
          </Card>

          {/* Lista */}
          {filamentPresets.length === 0 ? (
            <div className="border border-dashed rounded-lg py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum preset criado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...new Set(filamentPresets.map((p) => p.brand))]
                .sort()
                .map((brand) => {
                  const brandPresets = filamentPresets.filter(
                    (p) => p.brand === brand,
                  );
                  const materials = [
                    ...new Set(brandPresets.map((p) => p.material)),
                  ].sort();
                  return (
                    <div key={brand as string}>
                      <p className="text-xs font-bold text-foreground mb-1">
                        {brand as string}
                      </p>
                      <div className="space-y-1 pl-2">
                        {materials.map((material) => (
                          <div key={material as string}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                              {material as string}
                            </p>
                            <div className="flex flex-wrap gap-1.5 pl-2">
                              {brandPresets
                                .filter((p) => p.material === material)
                                .map((preset) => (
                                  <div
                                    key={preset.id}
                                    className="group/preset flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card hover:border-primary/30 transition-colors"
                                  >
                                    <div
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: preset.colorHex,
                                        boxShadow: `0 0 4px ${preset.colorHex}88`,
                                      }}
                                    />
                                    <span className="text-xs text-foreground">
                                      {preset.colorName}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleDeletePreset(preset.id)
                                      }
                                      className="ml-1 opacity-0 group-hover/preset:opacity-100 text-destructive/40 hover:text-destructive transition-all"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Categorias ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Categorias
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {categories.length}
            </Badge>
          </div>
          <NewCategoryDialog onCreated={refreshCategories} />
        </div>

        {categories.length === 0 ? (
          <div className="border border-dashed rounded-lg py-10 text-center">
            <Tag size={24} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria criada.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Cria categorias para organizar os teus produtos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <Badge variant="secondary" className="text-[10px]">
                      {cat._count?.products || 0} produto(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Extras ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Extras
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {extras.length}
            </Badge>
          </div>
          <NewExtraDialog onCreated={refreshExtras} />
        </div>

        {extras.length === 0 ? (
          <div className="border border-dashed rounded-lg py-10 text-center">
            <Package
              size={24}
              className="text-muted-foreground/40 mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Nenhum extra criado.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Adiciona materiais extra como correntes, parafusos, cola, etc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {extras.map((extra) => (
              <Card
                key={extra.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {extra.name}
                      </p>
                      {extra.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {extra.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteExtra(extra.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(extra.price)}
                      {extra.unit && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          / {extra.unit}
                        </span>
                      )}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {extra._count?.usages || 0} produto(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
