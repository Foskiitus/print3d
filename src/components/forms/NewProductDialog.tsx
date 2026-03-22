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
import { useIntlayer } from "next-intlayer";

async function executeDirectUpload(file: File, bucket: "images" | "models") {
  const signRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      bucket,
    }),
  });
  if (!signRes.ok) throw new Error("Falha ao gerar link de upload");
  const { url, key } = await signRes.json();
  const uploadRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!uploadRes.ok) throw new Error("Falha no upload para o storage");
  return key;
}

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const c = useIntlayer("dialogs");
  const d = c.product;

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

  const handleThreemfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > limitBytes) {
        toast({
          title: c.common.error.value,
          description: `O limite é ${limitMb}MB`,
          variant: "destructive",
        });
        return;
      }
      setThreemfFile(file);
    }
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
    setThreemfFile(null);
    setCostData(null);
    setErrors({});
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = d.nameRequired.value;
    if (!form.categoryId) newErrors.categoryId = d.categoryRequired.value;
    if (!form.printerId) newErrors.printerId = d.printerRequired.value;
    const totalMinutes =
      (parseInt(form.productionHours || "0") || 0) * 60 +
      (parseInt(form.productionMinutes || "0") || 0);
    if (totalMinutes <= 0) newErrors.productionTime = d.printTimeRequired.value;
    const validFilaments = filamentUsages.filter(
      (f) => f.filamentTypeId && f.weight && Number(f.weight) > 0,
    );
    if (validFilaments.length === 0)
      newErrors.filaments = d.filamentRequired.value;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      let imageKey = "";
      let modelKey = "";
      if (imageFile) imageKey = await executeDirectUpload(imageFile, "images");
      if (threemfFile) {
        setThreemfUploading(true);
        try {
          modelKey = await executeDirectUpload(threemfFile, "models");
        } finally {
          setThreemfUploading(false);
        }
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
          imageUrl: imageKey !== "" ? imageKey : null,
          fileUrl: modelKey !== "" ? modelKey : null,
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
      toast({ title: d.successToast.value });
      resetForm();
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast({
        title: c.common.error.value,
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
          {d.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Informação básica */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {d.sectionBasic}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="name">{d.name}</Label>
              <Input
                id="name"
                placeholder={d.namePlaceholder.value}
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
                {d.description}{" "}
                <span className="text-muted-foreground font-normal">
                  ({c.common.optional})
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder={d.descriptionPlaceholder.value}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{d.category}</Label>
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
                  placeholder={d.categoryPlaceholder.value}
                  searchPlaceholder={d.categorySearch.value}
                  className={errors.categoryId ? "border-destructive" : ""}
                />
                {errors.categoryId && (
                  <p className="text-xs text-destructive">
                    {errors.categoryId}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{d.printer}</Label>
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
                  placeholder={d.printerPlaceholder.value}
                  searchPlaceholder={d.printerSearch.value}
                  className={errors.printerId ? "border-destructive" : ""}
                />
                {errors.printerId && (
                  <p className="text-xs text-destructive">{errors.printerId}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{d.printTime}</Label>
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
                    {c.common.hours}
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
                    {c.common.minutes}
                  </span>
                </div>
              </div>
              {(form.productionHours || form.productionMinutes) && (
                <p className="text-[10px] text-muted-foreground">
                  {d.printTimeTotal}{" "}
                  {Number(form.productionHours || 0) * 60 +
                    Number(form.productionMinutes || 0)}{" "}
                  {d.printTimeMinutes}
                </p>
              )}
            </div>
          </div>

          {/* Filamentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {d.sectionFilaments}
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
                <Plus size={12} className="mr-1" /> {c.common.add}
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
                    placeholder={d.filamentPlaceholder.value}
                    searchPlaceholder={d.filamentSearch.value}
                    emptyText={d.filamentEmpty.value}
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
                        <Plus size={11} /> {d.registerSpool}
                      </button>
                    }
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={d.filamentGramsPlaceholder.value}
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
                {d.sectionExtras}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExtra}
              >
                <Plus size={12} className="mr-1" /> {c.common.add}
              </Button>
            </div>
            {extraUsages.length === 0 && (
              <p className="text-xs text-muted-foreground">{d.noExtras}</p>
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
                    placeholder={d.extraPlaceholder.value}
                    searchPlaceholder={d.extraSearch.value}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={d.extraQtyPlaceholder.value}
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
              <Label htmlFor="margin">{d.margin}</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="1000"
                placeholder={d.marginPlaceholder.value}
                value={form.margin}
                onChange={(e) => setForm({ ...form, margin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitsPerPrint">{d.unitsPerPrint}</Label>
              <Input
                id="unitsPerPrint"
                type="number"
                min="1"
                placeholder={d.unitsPerPrintPlaceholder.value}
                value={form.unitsPerPrint}
                onChange={(e) =>
                  setForm({ ...form, unitsPerPrint: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                {d.unitsPerPrintSub}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alertThreshold">
                {d.alertThreshold}{" "}
                <span className="text-muted-foreground font-normal">
                  ({c.common.optional})
                </span>
              </Label>
              <Input
                id="alertThreshold"
                type="number"
                min="0"
                placeholder={d.alertThresholdPlaceholder.value}
                value={form.alertThreshold}
                onChange={(e) =>
                  setForm({ ...form, alertThreshold: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                {d.alertThresholdSub}
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
                      {d.costEstimate}
                    </p>
                    {units > 1 && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {units} {d.unitsPerPrintLabel}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{d.costFilaments}</span>
                      <span>{formatCurrency(costData.filamentCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{d.costExtras}</span>
                      <span>{formatCurrency(costData.extrasCost)}</span>
                    </div>
                    {costData.printerCost != null && (
                      <div className="flex justify-between">
                        <span>{d.costPrinter}</span>
                        <span>{formatCurrency(costData.printerCost)}</span>
                      </div>
                    )}
                    {costData.electricityCost != null && (
                      <div className="flex justify-between">
                        <span>{d.costEnergy}</span>
                        <span>{formatCurrency(costData.electricityCost)}</span>
                      </div>
                    )}
                    {!form.printerId && (
                      <p className="text-[10px] text-warning">
                        ⚠️ {d.costNoPrinter}
                      </p>
                    )}
                    <div className="flex justify-between border-t border-border pt-1 mt-1 font-medium text-foreground">
                      <span>{d.costTotal}</span>
                      <span>{formatCurrency(costData.totalCost)}</span>
                    </div>
                    {units > 1 && (
                      <div className="flex justify-between text-foreground">
                        <span>{d.costPerUnit}</span>
                        <span>{formatCurrency(costPerUnit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-primary font-bold text-sm pt-1 border-t border-border mt-1">
                      <span>
                        {units > 1
                          ? `${d.suggestedPriceUnit} (${form.margin}% ${d.margin2})`
                          : `${d.suggestedPrice} (${form.margin}% ${d.margin2})`}
                      </span>
                      <span>{formatCurrency(pricePerUnit)}</span>
                    </div>
                  </div>
                  {costData.missingSpools?.length > 0 && (
                    <p className="text-[10px] text-warning mt-1">
                      ⚠️ {d.missingSpools} {costData.missingSpools.join(", ")}.{" "}
                      {d.missingSpoilsEst}
                    </p>
                  )}
                </div>
              );
            })()}

          {/* Ficheiros */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {d.sectionFiles}
            </p>
            <div className="space-y-2">
              <Label>{d.image}</Label>
              <div className="flex items-center gap-4">
                {imageFile ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <span>{imageFile.name}</span>
                    <button type="button" onClick={() => setImageFile(null)}>
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer border rounded-md px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
                    <Upload size={16} />
                    {d.chooseImage}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0])
                          setImageFile(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{d.model}</Label>
              <div className="p-4 border rounded-lg bg-muted/10">
                {threemfFile ? (
                  <div className="flex items-center justify-between bg-background p-3 rounded-md border">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {threemfFile.name}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(threemfFile.size / (1024 * 1024)).toFixed(2)} MB
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
                    {d.chooseModel}
                    <input
                      type="file"
                      accept=".3mf,.stl"
                      className="hidden"
                      onChange={handleThreemfChange}
                    />
                  </label>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  {d.modelLimit} {limitMb} MB · {d.modelFormats}
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || threemfUploading}
          >
            {threemfUploading
              ? d.submittingUpload
              : loading
                ? d.submitting
                : d.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
