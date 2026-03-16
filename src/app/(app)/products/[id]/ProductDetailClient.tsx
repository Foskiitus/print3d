"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Clock,
  Layers,
  Package,
  Download,
  TrendingUp,
  Euro,
  Pencil,
  X,
  Check,
  Trash2,
  Plus,
  Upload,
  Printer,
  FileBox,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";
import { toast } from "@/components/ui/toaster";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { useUploadLimit } from "@/hooks/useUploadLimit";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductDetailClient({
  product: initialProduct,
  costs: initialCosts,
}: {
  product: any;
  costs: {
    filamentCost: number;
    extrasCost: number;
    printerCost?: number | null;
    electricityCost?: number | null;
    totalCost: number;
    suggestedPrice: number;
  };
}) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [costs, setCosts] = useState(initialCosts);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState(0); // ✅ forçar recálculo ao entrar em edição

  // ✅ URL assinado para imagem privada
  const { signedUrl: signedImageUrl } = useSignedUrl(product.imageUrl);
  const { limitMb, limitBytes } = useUploadLimit();

  const [categories, setCategories] = useState<any[]>([]);
  const [filamentTypes, setFilamentTypes] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!editing) return;
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
  }, [editing]);

  useEffect(() => {
    if (!editing || !form) return;
    const validFilaments = form.filamentUsages.filter(
      (f: any) => f.filamentTypeId && f.weight && Number(f.weight) > 0,
    );
    if (validFilaments.length === 0) return;
    fetch("/api/products/estimate-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filamentUsages: validFilaments.map((f: any) => ({
          filamentTypeId: f.filamentTypeId,
          weight: Number(f.weight),
        })),
        extraUsages: form.extraUsages
          .filter((e: any) => e.extraId && e.quantity)
          .map((e: any) => ({
            extraId: e.extraId,
            quantity: Number(e.quantity),
          })),
        margin: Number(form.margin) / 100,
        unitsPerPrint: Number(form.unitsPerPrint) || 1,
        printerId: form.printerId || null,
        productionTime: (() => {
          const h = parseInt(form.productionHours || "0", 10) || 0;
          const m = parseInt(form.productionMinutes || "0", 10) || 0;
          const t = h * 60 + m;
          return t > 0 ? t : null;
        })(),
      }),
    })
      .then((r) => r.json())
      .then((data) => setCosts((prev: any) => ({ ...prev, ...data })))
      .catch(() => {});
  }, [
    form?.filamentUsages,
    form?.extraUsages,
    form?.margin,
    form?.unitsPerPrint,
    form?.printerId,
    form?.productionHours,
    form?.productionMinutes,
    editing,
    editKey,
  ]);

  const startEditing = () => {
    const totalMinutes = product.productionTime ?? 0;
    setForm({
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId ?? "",
      printerId: product.printerId ?? "",
      productionHours: String(Math.floor(totalMinutes / 60)),
      productionMinutes: String(totalMinutes % 60),
      margin: String(Math.round(product.margin * 100)),
      unitsPerPrint: String(product.unitsPerPrint ?? 1),
      alertThreshold:
        product.alertThreshold != null ? String(product.alertThreshold) : "",
      imageFile: null,
      imagePreview: product.imageUrl ?? null,
      imageUrl: product.imageUrl ?? null,
      threemfFile: null,
      threemfUploading: false,
      fileUrl: product.fileUrl ?? null,
      filamentUsages: product.filamentUsage.map((fu: any) => ({
        filamentTypeId: fu.filamentTypeId,
        weight: String(fu.weight),
      })),
      extraUsages: product.extras.map((pe: any) => ({
        extraId: pe.extraId,
        quantity: String(pe.quantity),
      })),
    });
    setEditing(true);
    setEditKey((k) => k + 1); // ✅ dispara o useEffect mesmo que os valores não mudem
  };

  const cancelEditing = () => {
    setEditing(false);
    setForm(null);
    setCosts(initialCosts);
  };

  const refreshFilamentTypes = async () => {
    const res = await fetch("/api/filaments/types");
    if (res.ok) setFilamentTypes(await res.json());
  };

  const addFilament = () =>
    setForm({
      ...form,
      filamentUsages: [
        ...form.filamentUsages,
        { filamentTypeId: "", weight: "" },
      ],
    });

  const removeFilament = (i: number) =>
    setForm({
      ...form,
      filamentUsages: form.filamentUsages.filter(
        (_: any, idx: number) => idx !== i,
      ),
    });

  const updateFilament = (i: number, field: string, value: string) =>
    setForm({
      ...form,
      filamentUsages: form.filamentUsages.map((f: any, idx: number) =>
        idx === i ? { ...f, [field]: value } : f,
      ),
    });

  const addExtra = () =>
    setForm({
      ...form,
      extraUsages: [...form.extraUsages, { extraId: "", quantity: "1" }],
    });

  const removeExtra = (i: number) =>
    setForm({
      ...form,
      extraUsages: form.extraUsages.filter((_: any, idx: number) => idx !== i),
    });

  const updateExtra = (i: number, field: string, value: string) =>
    setForm({
      ...form,
      extraUsages: form.extraUsages.map((e: any, idx: number) =>
        idx === i ? { ...e, [field]: value } : e,
      ),
    });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const validFilaments = form.filamentUsages.filter(
      (f: any) => f.filamentTypeId && f.weight && Number(f.weight) > 0,
    );
    if (validFilaments.length === 0) {
      toast({
        title: "Adiciona pelo menos um filamento",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (form.imageFile) {
        const fd = new FormData();
        fd.append("file", form.imageFile);
        fd.append("type", "image");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        imageUrl = d.url;
      }

      let fileUrl = form.fileUrl;
      if (form.threemfFile) {
        setForm((f: any) => ({ ...f, threemfUploading: true }));
        const fd = new FormData();
        fd.append("file", form.threemfFile);
        fd.append("type", "3mf");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        setForm((f: any) => ({ ...f, threemfUploading: false }));
        if (!r.ok) throw new Error(d.error);
        fileUrl = d.url;
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
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
          alertThreshold:
            form.alertThreshold !== "" ? Number(form.alertThreshold) : null,
          imageUrl,
          fileUrl,
          filamentUsages: validFilaments.map((f: any) => ({
            filamentTypeId: f.filamentTypeId,
            weight: Number(f.weight),
          })),
          extraUsages: form.extraUsages
            .filter((e: any) => e.extraId && e.quantity)
            .map((e: any) => ({
              extraId: e.extraId,
              quantity: Number(e.quantity),
            })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Produto atualizado!" });
      setProduct(data);
      setEditing(false);
      setForm(null);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Modo de visualização ──────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil size={13} className="mr-1.5" />
            Editar produto
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {product.imageUrl ? (
              <div className="aspect-square rounded-xl overflow-hidden border bg-muted">
                {signedImageUrl ? (
                  <img
                    src={signedImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // A carregar o URL assinado
                  <div className="w-full h-full bg-muted animate-pulse" />
                )}
              </div>
            ) : (
              <div className="aspect-square rounded-xl border bg-muted/40 flex items-center justify-center">
                <Package size={48} className="text-muted-foreground/30" />
              </div>
            )}

            {product.fileUrl && (
              <a
                href={product.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full justify-center border border-dashed rounded-lg p-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Download size={13} />
                Descarregar ficheiro de impressão
              </a>
            )}

            <Card>
              <CardContent className="p-5 space-y-3">
                {product.description && (
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {product.productionTime && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Clock size={9} />
                      {Math.floor(product.productionTime / 60) > 0 &&
                        `${Math.floor(product.productionTime / 60)}h `}
                      {product.productionTime % 60 > 0 &&
                        `${product.productionTime % 60}min`}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <TrendingUp size={9} />
                    {(product.margin * 100).toFixed(0)}% margem
                  </Badge>
                  {product.printer && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Printer size={9} />
                      {product.printer.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Layers size={9} />
                    {product.filamentUsage.length} filamento(s)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Estimativa de Custo (FIFO)
                  </p>
                  {product.unitsPerPrint > 1 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {product.unitsPerPrint} unidades/impressão
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filamentos</span>
                    <span>{formatCurrency(costs.filamentCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extras</span>
                    <span>{formatCurrency(costs.extrasCost)}</span>
                  </div>
                  {costs.printerCost != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impressora</span>
                      <span>{formatCurrency(costs.printerCost)}</span>
                    </div>
                  )}
                  {costs.electricityCost != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Energia</span>
                      <span>{formatCurrency(costs.electricityCost)}</span>
                    </div>
                  )}
                  {!product.printerId && (
                    <p className="text-[10px] text-warning">
                      ⚠️ Sem impressora definida — custos de máquina e energia
                      não incluídos.
                    </p>
                  )}
                  <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
                    <span>Custo total da impressão</span>
                    <span>{formatCurrency(costs.totalCost)}</span>
                  </div>
                  {product.unitsPerPrint > 1 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Custo por unidade</span>
                      <span>
                        {formatCurrency(
                          costs.totalCost / product.unitsPerPrint,
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-primary font-bold text-base pt-1 border-t border-border mt-1">
                    <span>
                      {product.unitsPerPrint > 1
                        ? "Preço sugerido/unidade"
                        : "Preço sugerido"}
                    </span>
                    <span>
                      {formatCurrency(
                        costs.suggestedPrice / product.unitsPerPrint,
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                  Filamentos
                </p>
                <div className="space-y-2">
                  {product.filamentUsage.map((fu: any) => (
                    <div
                      key={fu.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: fu.filamentType.colorHex }}
                        />
                        <span>
                          {fu.filamentType.brand} {fu.filamentType.material} —{" "}
                          {fu.filamentType.colorName}
                        </span>
                      </div>
                      <span className="font-medium text-muted-foreground">
                        {fu.weight}g
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {product.extras.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                    Extras
                  </p>
                  <div className="space-y-2">
                    {product.extras.map((pe: any) => (
                      <div
                        key={pe.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{pe.extra.name}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>×{pe.quantity}</span>
                          <span>
                            {formatCurrency(pe.extra.price * pe.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {product.productionLogs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Histórico de Produção
            </h2>
            <div className="space-y-2">
              {product.productionLogs.map((log: any) => (
                <Card key={log.id} className="bg-muted/20 border-none">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="secondary"
                          className="text-[10px] flex-shrink-0"
                        >
                          ×{log.quantity}
                        </Badge>
                        <span className="text-muted-foreground text-xs truncate">
                          {log.printer.name} · {formatDate(log.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Euro size={12} className="text-muted-foreground" />
                        <span className="font-medium text-xs">
                          {formatCurrency(log.totalCost || 0)}
                        </span>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 ml-8">
                        {log.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Modo de edição ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm font-medium text-primary">Modo de edição</p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEditing}
            disabled={saving}
          >
            <X size={13} className="mr-1.5" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || form?.threemfUploading}
          >
            <Check size={13} className="mr-1.5" />
            {form?.threemfUploading
              ? "A fazer upload..."
              : saving
                ? "A guardar..."
                : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {/* Imagem */}
          {form.imagePreview ? (
            <div className="relative aspect-square rounded-xl overflow-hidden border">
              <img
                src={
                  form.imageFile
                    ? form.imagePreview
                    : (signedImageUrl ?? undefined)
                }
                alt="preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    imageFile: null,
                    imagePreview: null,
                    imageUrl: null,
                  })
                }
                className="absolute top-2 right-2 w-7 h-7 bg-destructive text-white rounded-lg flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="aspect-square rounded-xl border border-dashed bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
              <Upload size={24} className="text-muted-foreground/40 mb-2" />
              <span className="text-xs text-muted-foreground">
                Clica para adicionar imagem
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    setForm({
                      ...form,
                      imageFile: file,
                      imagePreview: URL.createObjectURL(file),
                    });
                }}
              />
            </label>
          )}

          {/* Ficheiro 3MF / STL */}
          <div className="space-y-2">
            <Label>
              Ficheiro de impressão{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            {form.threemfFile ? (
              <div className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-muted/30">
                <FileBox size={16} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {form.threemfFile.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(form.threemfFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, threemfFile: null })}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : form.fileUrl ? (
              <div className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-muted/30">
                <FileBox size={16} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    Ficheiro existente
                  </p>
                  <a
                    href={form.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline"
                  >
                    Ver ficheiro atual
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, fileUrl: null })}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Remover ficheiro"
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
                  onChange={(e) => {
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
                    setForm({ ...form, threemfFile: file });
                  }}
                />
              </label>
            )}
            <p className="text-[10px] text-muted-foreground">
              Limite máximo: {limitMb} MB · Formatos aceites: .3mf, .stl
            </p>
          </div>

          {/* Info básica */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
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
                <Label>Impressora</Label>
                <Select
                  value={form.printerId}
                  onValueChange={(v) => setForm({ ...form, printerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tempo de impressão</Label>
                <div className="flex gap-2">
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
              </div>
              <div className="space-y-1.5">
                <Label>Margem (%)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.margin}
                  onChange={(e) => setForm({ ...form, margin: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidades por impressão</Label>
                <Input
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
              <div className="space-y-1.5">
                <Label>
                  Alerta de stock mínimo{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
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
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Custo atualizado */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Estimativa de Custo (FIFO)
                </p>
                {Number(form.unitsPerPrint) > 1 && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {form.unitsPerPrint} unidades/impressão
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filamentos</span>
                  <span>{formatCurrency(costs.filamentCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extras</span>
                  <span>{formatCurrency(costs.extrasCost)}</span>
                </div>
                {costs.printerCost != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressora</span>
                    <span>{formatCurrency(costs.printerCost)}</span>
                  </div>
                )}
                {costs.electricityCost != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Energia</span>
                    <span>{formatCurrency(costs.electricityCost)}</span>
                  </div>
                )}
                {!form.printerId && (
                  <p className="text-[10px] text-warning">
                    ⚠️ Seleciona uma impressora para incluir custos de máquina e
                    energia.
                  </p>
                )}
                <div className="flex justify-between font-medium border-t border-border pt-2 mt-2">
                  <span>Custo total da impressão</span>
                  <span>{formatCurrency(costs.totalCost)}</span>
                </div>
                {Number(form.unitsPerPrint) > 1 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Custo por unidade</span>
                    <span>
                      {formatCurrency(
                        costs.totalCost / (Number(form.unitsPerPrint) || 1),
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-primary font-bold text-base pt-1 border-t border-border mt-1">
                  <span>
                    {Number(form.unitsPerPrint) > 1
                      ? `Preço sugerido/unidade (${form.margin}% margem)`
                      : `Preço sugerido (${form.margin}% margem)`}
                  </span>
                  <span>
                    {formatCurrency(
                      costs.suggestedPrice / (Number(form.unitsPerPrint) || 1),
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filamentos editáveis */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Filamentos
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
              {form.filamentUsages.map((f: any, i: number) => (
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
                                <Plus size={12} /> Registar nova bobine
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
                  {form.filamentUsages.length > 1 && (
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
            </CardContent>
          </Card>

          {/* Extras editáveis */}
          <Card>
            <CardContent className="p-5 space-y-3">
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
              {form.extraUsages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum extra adicionado.
                </p>
              )}
              {form.extraUsages.map((e: any, i: number) => (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
