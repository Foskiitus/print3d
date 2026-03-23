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
import { Plus, Upload, X, Info } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { useIntlayer } from "next-intlayer";

// ─── Upload helper (mantido igual ao original) ────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const c = useIntlayer("dialogs");
  const d = c.product;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    margin: "30",
    alertThreshold: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar categorias ao abrir
  useEffect(() => {
    if (!open) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [open]);

  function resetForm() {
    setForm({
      name: "",
      description: "",
      categoryId: "",
      margin: "30",
      alertThreshold: "",
    });
    setImageFile(null);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = d.nameRequired.value;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      let imageKey = "";
      if (imageFile) imageKey = await executeDirectUpload(imageFile, "images");

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          categoryId: form.categoryId || null,
          margin: Number(form.margin) / 100,
          alertThreshold: form.alertThreshold
            ? Number(form.alertThreshold)
            : null,
          imageUrl: imageKey !== "" ? imageKey : null,
          imageKey: imageKey !== "" ? imageKey : null,
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
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
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

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{d.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nota informativa sobre o novo fluxo BOM */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Info size={13} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Após criar o produto, abre-o para adicionar os{" "}
              <strong className="text-foreground">componentes (BOM)</strong> — é
              nos componentes que defines filamentos, tempos e ficheiros .3mf.
            </p>
          </div>

          {/* Nome */}
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
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
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

          {/* Categoria + Margem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{d.category}</Label>
              <SearchableSelect
                options={categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
                placeholder={d.categoryPlaceholder.value}
                searchPlaceholder={d.categorySearch.value}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="margin">{d.margin}</Label>
              <div className="relative">
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder={d.marginPlaceholder.value}
                  value={form.margin}
                  onChange={(e) => setForm({ ...form, margin: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Alerta de stock */}
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

          {/* Imagem de capa */}
          <div className="space-y-1.5">
            <Label>{d.image}</Label>
            {imageFile ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                <span className="text-xs text-foreground flex-1 truncate">
                  {imageFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/20 transition-colors w-full">
                <Upload size={14} />
                {d.chooseImage}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                  }}
                />
              </label>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? d.submitting : d.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
