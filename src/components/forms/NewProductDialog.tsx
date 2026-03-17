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
import { toast } from "@/components/ui/toaster";
import { Plus, Trash2, Upload, X, FileBox } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { useUploadLimit } from "@/hooks/useUploadLimit";

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { limitMb, limitBytes } = useUploadLimit();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [costData, setCostData] = useState<any>(null);
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [filamentTypes, setFilamentTypes] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);

  const refreshFilamentTypes = async () => {
    const res = await fetch("/api/filaments/types");
    if (res.ok) setFilamentTypes(await res.json());
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    printerId: "",
    productionHours: "",
    productionMinutes: "",
    margin: "30",
    unitsPerPrint: "1",
    alertThreshold: "",
  });

  const [filamentUsages, setFilamentUsages] = useState<
    { filamentTypeId: string; weight: string }[]
  >([{ filamentTypeId: "", weight: "" }]);

  const [extraUsages, setExtraUsages] = useState<
    { extraId: string; quantity: string }[]
  >([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [threemfFile, setThreemfFile] = useState<File | null>(null);
  const [threemfUploading, setThreemfUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/filaments/types").then((r) => r.json()),
      fetch("/api/extras").then((r) => r.json()),
      fetch("/api/printers").then((r) => r.json()),
    ]).then(([cats, fils, exts, prints]) => {
      setCategories(cats);
      setFilamentTypes(fils);
      setExtras(exts);
      setPrinters(prints);
    });
  }, [open]);

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
        printerId: form.printerId || null,
        productionTime: (() => {
          const h = parseInt(form.productionHours || "0", 10) || 0;
          const m = parseInt(form.productionMinutes || "0", 10) || 0;
          const total = h * 60 + m;
          return total > 0 ? total : null;
        })(),
      }),
    })
      .then((r) => r.json())
      .then(setCostData)
      .catch(() => setCostData(null));
  }, [
    filamentUsages,
    extraUsages,
    form.margin,
    form.printerId,
    form.productionHours,
    form.productionMinutes,
    open,
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleThreemfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > limitBytes) {
      toast({
        title: "Ficheiro demasiado grande",
        description: `O limite máximo é ${limitMb} MB. Este ficheiro tem ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setThreemfFile(file);
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
      printerId: "",
      productionHours: "",
      productionMinutes: "",
      margin: "30",
      unitsPerPrint: "1",
      alertThreshold: "",
    });
    setFilamentUsages([{ filamentTypeId: "", weight: "" }]);
    setExtraUsages([]);
    setImageFile(null);
    setImagePreview(null);
    setThreemfFile(null);
    setCostData(null);
    setErrors({});
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validação
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "O nome é obrigatório.";
    if (!form.categoryId) newErrors.categoryId = "Seleciona uma categoria.";
    if (!form.printerId) newErrors.printerId = "Seleciona uma impressora.";
    const totalMinutes =
      (parseInt(form.productionHours || "0") || 0) * 60 +
      (parseInt(form.productionMinutes || "0") || 0);
    if (totalMinutes <= 0)
      newErrors.productionTime = "Define o tempo de impressão.";

    const validFilaments = filamentUsages.filter(
      (f) => f.filamentTypeId && f.weight && Number(f.weight) > 0,
    );
    if (validFilaments.length === 0)
      newErrors.filaments =
        "Adiciona pelo menos um filamento com peso definido.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      // Upload imagem
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

      // Upload .3mf / .stl
      let fileUrl = null;
      if (threemfFile) {
        setThreemfUploading(true);
        const fd = new FormData();
        fd.append("file", threemfFile);
        fd.append("type", "3mf");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        setThreemfUploading(false);
        if (!r.ok) throw new Error(d.error);
        fileUrl = d.url;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          categoryId: form.categoryId || null,
          printerId: form.printerId || null,
          productionTime: (() => {
            const h = parseInt(form.productionHours || "0", 10) || 0;
            const m = parseInt(form.productionMinutes || "0", 10) || 0;
            const total = h * 60 + m;
            return total > 0 ? total : null;
          })(),
          margin: Number(form.margin) / 100,
          unitsPerPrint: Number(form.unitsPerPrint) || 1,
          alertThreshold: form.alertThreshold
            ? Number(form.alertThreshold)
            : null,
          imageUrl,
          fileUrl,
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
      setThreemfUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
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
          {/* Informação básica */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Informação básica
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                placeholder="ex: Porta-chaves Coração"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setErrors((er) => ({ ...er, name: "" }));
                }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
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
                <SearchableSelect
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={form.categoryId}
                  onValueChange={(v) => {
                    setForm({ ...form, categoryId: v });
                    setErrors((er) => ({ ...er, categoryId: "" }));
                  }}
                  placeholder="Selecionar..."
                  searchPlaceholder="Pesquisar categoria..."
                  className={errors.categoryId ? "border-destructive" : ""}
                />
                {errors.categoryId && (
                  <p className="text-xs text-destructive">
                    {errors.categoryId}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Impressora</Label>
                <SearchableSelect
                  options={printers.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={form.printerId}
                  onValueChange={(v) => {
                    setForm({ ...form, printerId: v });
                    setErrors((er) => ({ ...er, printerId: "" }));
                  }}
                  placeholder="Selecionar..."
                  searchPlaceholder="Pesquisar impressora..."
                  className={errors.printerId ? "border-destructive" : ""}
                />
                {errors.printerId && (
                  <p className="text-xs text-destructive">{errors.printerId}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tempo de impressão</Label>
              <div
                className={`flex items-center gap-2 ${errors.productionTime ? "ring-1 ring-destructive rounded-lg" : ""}`}
              >
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.productionHours}
                    onChange={(e) => {
                      setForm({ ...form, productionHours: e.target.value });
                      setErrors((er) => ({ ...er, productionTime: "" }));
                    }}
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
                    onChange={(e) => {
                      setForm({ ...form, productionMinutes: e.target.value });
                      setErrors((er) => ({ ...er, productionTime: "" }));
                    }}
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

          {/* Filamentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Filamentos usados
                </p>
                {errors.filaments && (
                  <p className="text-xs text-destructive mt-0.5">
                    {errors.filaments}
                  </p>
                )}
              </div>
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
                <div className="flex-1 space-y-1">
                  <SearchableSelect
                    options={filamentTypes.map((ft) => ({
                      value: ft.id,
                      label: `${ft.brand} ${ft.material} — ${ft.colorName}`,
                      render: (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ft.colorHex }}
                          />
                          {ft.brand} {ft.material} — {ft.colorName}
                        </div>
                      ),
                    }))}
                    value={f.filamentTypeId}
                    onValueChange={(v) =>
                      updateFilament(i, "filamentTypeId", v)
                    }
                    placeholder="Tipo de filamento..."
                    searchPlaceholder="Pesquisar filamento..."
                    emptyText="Nenhum filamento encontrado."
                  />
                  <AddSpoolDialog
                    types={filamentTypes}
                    onAdded={refreshFilamentTypes}
                    onOpenChange={setIsChildDialogOpen}
                    trigger={
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-0.5"
                      >
                        <Plus size={11} /> Registar nova bobine
                      </button>
                    }
                  />
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

          {/* Extras */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                  <SearchableSelect
                    options={extras.map((ex) => ({
                      value: ex.id,
                      label: `${ex.name} — ${formatCurrency(ex.price)}/${ex.unit || "un"}`,
                    }))}
                    value={e.extraId}
                    onValueChange={(v) => updateExtra(i, "extraId", v)}
                    placeholder="Extra..."
                    searchPlaceholder="Pesquisar extra..."
                  />
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

          {/* Margem e unidades */}
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
                placeholder="ex: 1"
                value={form.unitsPerPrint}
                onChange={(e) =>
                  setForm({ ...form, unitsPerPrint: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Quantas unidades saem de cada impressão
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alertThreshold">
                Alerta de stock mínimo{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="alertThreshold"
                type="number"
                min="0"
                placeholder="ex: 5"
                value={form.alertThreshold}
                onChange={(e) =>
                  setForm({ ...form, alertThreshold: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Recebe um alerta quando o stock baixar deste valor
              </p>
            </div>
          </div>

          {/* Preview de custo */}
          {costData &&
            (() => {
              const units = Number(form.unitsPerPrint) || 1;
              const costPerUnit = costData.totalCost / units;
              const pricePerUnit = costData.suggestedPrice / units;
              return (
                <div className="p-4 rounded-lg bg-muted/40 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      Estimativa de custo
                    </p>
                    {units > 1 && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
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
                    {costData.printerCost != null && (
                      <div className="flex justify-between">
                        <span>Impressora</span>
                        <span>{formatCurrency(costData.printerCost)}</span>
                      </div>
                    )}
                    {costData.electricityCost != null && (
                      <div className="flex justify-between">
                        <span>Energia</span>
                        <span>{formatCurrency(costData.electricityCost)}</span>
                      </div>
                    )}
                    {!form.printerId && (
                      <p className="text-[10px] text-warning">
                        ⚠️ Seleciona uma impressora para incluir custos de
                        máquina e energia.
                      </p>
                    )}
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
                    <p className="text-[10px] text-warning mt-1">
                      ⚠️ Sem bobines em stock para:{" "}
                      {costData.missingSpools.join(", ")}. Custo estimado a 0€.
                    </p>
                  )}
                </div>
              );
            })()}

          {/* Ficheiros */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-lg flex items-center justify-center"
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

            {/* Ficheiro 3MF / STL */}
            <div className="space-y-2">
              <Label>
                Ficheiro de impressão{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              {threemfFile ? (
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-muted/30">
                  <FileBox size={16} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {threemfFile.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(threemfFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThreemfFile(null)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 w-fit cursor-pointer border border-dashed rounded-lg px-4 py-2 text-xs text-muted-foreground hover:border-primary/40 transition-colors">
                  <FileBox size={14} />
                  Escolher .3mf ou .stl
                  <input
                    type="file"
                    accept=".3mf,.stl"
                    className="hidden"
                    onChange={handleThreemfChange}
                  />
                </label>
              )}
              <p className="text-[10px] text-muted-foreground">
                Limite máximo: {limitMb} MB · Formatos aceites: .3mf, .stl
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || threemfUploading}
          >
            {threemfUploading
              ? "A fazer upload do ficheiro..."
              : loading
                ? "A criar..."
                : "Criar Produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
