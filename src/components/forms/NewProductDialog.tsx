"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [costData, setCostData] = useState<any>(null);
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);

  // Dados de suporte
  const [categories, setCategories] = useState<any[]>([]);
  const [filamentTypes, setFilamentTypes] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);

  const refreshFilamentTypes = async () => {
    const res = await fetch("/api/filaments/types");
    if (res.ok) setFilamentTypes(await res.json());
  };

  // Formulário base
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    productionHours: "",
    productionMinutes: "",
    margin: "30",
    unitsPerPrint: "1",
  });

  // Filamentos usados
  const [filamentUsages, setFilamentUsages] = useState<
    { filamentTypeId: string; weight: string }[]
  >([{ filamentTypeId: "", weight: "" }]);

  // Extras usados
  const [extraUsages, setExtraUsages] = useState<
    { extraId: string; quantity: string }[]
  >([]);

  // Upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Carregar dados quando o dialog abre
  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/filaments/types").then((r) => r.json()),
      fetch("/api/extras").then((r) => r.json()),
    ]).then(([cats, fils, exts]) => {
      setCategories(cats);
      setFilamentTypes(fils);
      setExtras(exts);
    });
  }, [open]);

  // Calcular custo estimado sempre que filamentos/extras/margem mudam
  useEffect(() => {
    if (!open) return;
    const validFilaments = filamentUsages.filter(
      (f) => f.filamentTypeId && f.weight && Number(f.weight) > 0,
    );
    if (validFilaments.length === 0) {
      setCostData(null);
      return;
    }
    fetch("/api/products/estimate-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filamentUsages: validFilaments.map((f) => ({
          filamentTypeId: f.filamentTypeId,
          weight: Number(f.weight),
        })),
        extraUsages: extraUsages
          .filter((e) => e.extraId && e.quantity)
          .map((e) => ({ extraId: e.extraId, quantity: Number(e.quantity) })),
        margin: Number(form.margin) / 100,
        unitsPerPrint: Number(form.unitsPerPrint) || 1,
      }),
    })
      .then((r) => r.json())
      .then(setCostData)
      .catch(() => setCostData(null));
  }, [filamentUsages, extraUsages, form.margin, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addFilament = () =>
    setFilamentUsages([...filamentUsages, { filamentTypeId: "", weight: "" }]);

  const removeFilament = (i: number) =>
    setFilamentUsages(filamentUsages.filter((_, idx) => idx !== i));

  const updateFilament = (i: number, field: string, value: string) =>
    setFilamentUsages(
      filamentUsages.map((f, idx) =>
        idx === i ? { ...f, [field]: value } : f,
      ),
    );

  const addExtra = () =>
    setExtraUsages([...extraUsages, { extraId: "", quantity: "1" }]);

  const removeExtra = (i: number) =>
    setExtraUsages(extraUsages.filter((_, idx) => idx !== i));

  const updateExtra = (i: number, field: string, value: string) =>
    setExtraUsages(
      extraUsages.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      categoryId: "",
      productionHours: "",
      productionMinutes: "",
      margin: "30",
      unitsPerPrint: "1",
    });
    setFilamentUsages([{ filamentTypeId: "", weight: "" }]);
    setExtraUsages([]);
    setImageFile(null);
    setImagePreview(null);
    setCostData(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const validFilaments = filamentUsages.filter(
      (f) => f.filamentTypeId && f.weight && Number(f.weight) > 0,
    );
    if (validFilaments.length === 0) {
      toast({
        title: "Adiciona pelo menos um filamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload imagem se existir
      let imageUrl = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append("type", "image");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        imageUrl = d.url;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          categoryId: form.categoryId || null,
          productionTime: (() => {
            const h = parseInt(form.productionHours || "0", 10) || 0;
            const m = parseInt(form.productionMinutes || "0", 10) || 0;
            const total = h * 60 + m;
            return total > 0 ? total : null;
          })(),
          margin: Number(form.margin) / 100,
          unitsPerPrint: Number(form.unitsPerPrint) || 1,
          imageUrl,
          fileUrl: null,
          filamentUsages: validFilaments.map((f) => ({
            filamentTypeId: f.filamentTypeId,
            weight: Number(f.weight),
          })),
          extraUsages: extraUsages
            .filter((e) => e.extraId && e.quantity)
            .map((e) => ({ extraId: e.extraId, quantity: Number(e.quantity) })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Produto criado!" });
      resetForm();
      setOpen(false);
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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // ✅ Não fechar o dialog do produto enquanto o dialog da bobine estiver aberto
        if (!v && isChildDialogOpen) return;
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* ── Informação básica ── */}
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Informação básica
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                placeholder="ex: Porta-chaves Coração"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Descrição{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Descrição do produto..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tempo de impressão</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.productionHours}
                      onChange={(e) =>
                        setForm({ ...form, productionHours: e.target.value })
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      h
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={form.productionMinutes}
                      onChange={(e) =>
                        setForm({ ...form, productionMinutes: e.target.value })
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      min
                    </span>
                  </div>
                </div>
                {(form.productionHours || form.productionMinutes) && (
                  <p className="text-[10px] text-muted-foreground">
                    Total:{" "}
                    {Number(form.productionHours || 0) * 60 +
                      Number(form.productionMinutes || 0)}{" "}
                    minutos
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Filamentos ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Filamentos usados
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFilament}
              >
                <Plus size={12} className="mr-1" /> Adicionar
              </Button>
            </div>

            {filamentUsages.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={f.filamentTypeId}
                    onValueChange={(v) =>
                      updateFilament(i, "filamentTypeId", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de filamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filamentTypes.map((ft) => (
                        <SelectItem key={ft.id} value={ft.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ft.colorHex }}
                            />
                            {ft.brand} {ft.material} — {ft.colorName}
                          </div>
                        </SelectItem>
                      ))}
                      {/* ✅ Opção rápida para registar nova bobine */}
                      <div className="px-2 py-1.5 border-t border-border mt-1">
                        <AddSpoolDialog
                          types={filamentTypes}
                          onAdded={refreshFilamentTypes}
                          onOpenChange={setIsChildDialogOpen}
                          trigger={
                            <button
                              type="button"
                              className="flex items-center gap-2 w-full text-xs text-primary hover:text-primary/80 transition-colors py-1"
                            >
                              <Plus size={12} />
                              Registar nova bobine
                            </button>
                          }
                        />
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="gramas"
                    value={f.weight}
                    onChange={(e) =>
                      updateFilament(i, "weight", e.target.value)
                    }
                  />
                </div>
                {filamentUsages.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive/50 hover:text-destructive"
                    onClick={() => removeFilament(i)}
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* ── Extras ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Extras
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExtra}
              >
                <Plus size={12} className="mr-1" /> Adicionar
              </Button>
            </div>

            {extraUsages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum extra adicionado.
              </p>
            )}

            {extraUsages.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={e.extraId}
                    onValueChange={(v) => updateExtra(i, "extraId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Extra..." />
                    </SelectTrigger>
                    <SelectContent>
                      {extras.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.name} — {formatCurrency(ex.price)}/
                          {ex.unit || "un"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="qtd"
                    value={e.quantity}
                    onChange={(ev) =>
                      updateExtra(i, "quantity", ev.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive/50 hover:text-destructive"
                  onClick={() => removeExtra(i)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
          </div>

          {/* ── Margem e unidades por impressão ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="margin">Margem de lucro (%)</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="1000"
                placeholder="ex: 30"
                value={form.margin}
                onChange={(e) => setForm({ ...form, margin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitsPerPrint">Unidades por impressão</Label>
              <Input
                id="unitsPerPrint"
                type="number"
                min="1"
                placeholder="ex: 31"
                value={form.unitsPerPrint}
                onChange={(e) =>
                  setForm({ ...form, unitsPerPrint: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Quantas unidades saem de cada impressão
              </p>
            </div>
          </div>

          {/* ── Preview de custo ── */}
          {costData &&
            (() => {
              const units = Number(form.unitsPerPrint) || 1;
              const costPerUnit = costData.totalCost / units;
              const pricePerUnit = costData.suggestedPrice / units;
              return (
                <div className="p-4 rounded-lg bg-muted/40 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Estimativa de custo</p>
                    {units > 1 && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {units} unidades/impressão
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Filamentos (FIFO)</span>
                      <span>{formatCurrency(costData.filamentCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extras</span>
                      <span>{formatCurrency(costData.extrasCost)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1 font-medium text-foreground">
                      <span>Custo total da impressão</span>
                      <span>{formatCurrency(costData.totalCost)}</span>
                    </div>
                    {units > 1 && (
                      <div className="flex justify-between text-foreground">
                        <span>Custo por unidade</span>
                        <span>{formatCurrency(costPerUnit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-primary font-bold text-sm pt-1 border-t border-border mt-1">
                      <span>
                        {units > 1
                          ? `Preço sugerido/unidade (${form.margin}% margem)`
                          : `Preço sugerido (${form.margin}% margem)`}
                      </span>
                      <span>{formatCurrency(pricePerUnit)}</span>
                    </div>
                  </div>
                  {costData.missingSpools?.length > 0 && (
                    <p className="text-[10px] text-yellow-500 mt-1">
                      ⚠️ Sem bobines em stock para:{" "}
                      {costData.missingSpools.join(", ")}. Custo estimado a 0€.
                    </p>
                  )}
                </div>
              );
            })()}

          {/* ── Ficheiros ── */}
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ficheiros
            </p>

            {/* Imagem */}
            <div className="space-y-2">
              <Label>Imagem do produto</Label>
              {imagePreview ? (
                <div className="relative w-32 h-32">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 w-fit cursor-pointer border border-dashed rounded-lg px-4 py-2 text-xs text-muted-foreground hover:border-primary/40 transition-colors">
                  <Upload size={14} />
                  Escolher imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A criar..." : "Criar Produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
