"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Wrench,
  Trash2,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { HardwareItem } from "../InventoryPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  hardware: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  consumable: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  packaging: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  maintenance: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const UNITS = ["un", "g", "ml", "m"];

// ─── HardwareDialog ───────────────────────────────────────────────────────────

function HardwareDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item?: HardwareItem | null;
  onSaved: () => void;
}) {
  const c = useIntlayer("inventory");
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);

  const formFromItem = (i: HardwareItem | null | undefined) => ({
    name: i?.name ?? "",
    category: i?.category ?? "hardware",
    unit: i?.unit ?? "un",
    quantity: i?.quantity?.toString() ?? "0",
    alertThreshold: i?.alertThreshold?.toString() ?? "",
    price: i?.price?.toString() ?? "0",
    description: i?.description ?? "",
  });

  const [form, setForm] = useState(formFromItem(item));

  // Atualiza o form sempre que o item muda — fix: dados de outro extra no dialog
  useEffect(() => {
    setForm(formFromItem(item));
  }, [item]);

  const handleOpenChange = (v: boolean) => {
    if (!v) setForm(formFromItem(item));
    onOpenChange(v);
  };

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const url = isEdit
        ? `${SITE_URL}/api/extras/${item!.id}`
        : `${SITE_URL}/api/extras`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category,
          unit: form.unit,
          quantity: Number(form.quantity) || 0,
          alertThreshold: form.alertThreshold
            ? Number(form.alertThreshold)
            : null,
          price: Number(form.price) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: isEdit
          ? c.hardware.toast.updated.value
          : c.hardware.toast.added.value,
      });
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({
        title: c.hardware.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? c.hardware.dialog.titleEdit.value
              : c.hardware.dialog.titleAdd.value}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label>{c.hardware.fields.name.value}</Label>
            <Input
              placeholder={c.hardware.fields.namePlaceholder.value}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Categoria + Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{c.hardware.fields.category.value}</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="hardware">
                  {c.hardware.categories.hardware.value}
                </option>
                <option value="consumable">
                  {c.hardware.categories.consumable.value}
                </option>
                <option value="packaging">
                  {c.hardware.categories.packaging.value}
                </option>
                <option value="maintenance">
                  {c.hardware.categories.maintenance.value}
                </option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{c.hardware.fields.unit.value}</Label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade + Alerta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{c.hardware.fields.quantity.value}</Label>
              <Input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {c.hardware.fields.alertThreshold.value}{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  ({c.hardware.fields.optional.value})
                </span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="ex: 50"
                value={form.alertThreshold}
                onChange={(e) =>
                  setForm({ ...form, alertThreshold: e.target.value })
                }
              />
            </div>
          </div>

          {/* Custo unitário */}
          <div className="space-y-1.5">
            <Label>{c.hardware.fields.unitCost.value}</Label>
            <Input
              type="number"
              min="0"
              step="0.001"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>
              {c.hardware.fields.notes.value}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                ({c.hardware.fields.optional.value})
              </span>
            </Label>
            <Input
              placeholder="..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {c.hardware.dialog.cancel.value}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? c.hardware.dialog.submitting.value
                : c.hardware.dialog.submit.value}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── HardwareCard ─────────────────────────────────────────────────────────────

function HardwareCard({
  item,
  onEdit,
  onDelete,
}: {
  item: HardwareItem;
  onEdit: (item: HardwareItem) => void;
  onDelete: (id: string) => void;
}) {
  const c = useIntlayer("inventory");
  const category = item.category ?? "hardware";
  const qty = item.quantity ?? 0;
  const threshold = item.alertThreshold ?? null;
  const isLow = threshold !== null && qty <= threshold;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 group transition-colors",
        isLow ? "border-amber-500/30" : "border-border",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {item.name}
            </p>
            {isLow && (
              <AlertTriangle
                size={12}
                className="text-amber-500 flex-shrink-0"
              />
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Quantidade */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className={cn(
              "text-2xl font-bold",
              isLow ? "text-amber-500" : "text-foreground",
            )}
          >
            {qty}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.unit ?? "un"}
            {threshold !== null && (
              <span className="ml-1 text-muted-foreground/60">
                (min: {threshold})
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            €{item.price.toFixed(3)}/{item.unit ?? "un"}
          </p>
          <Badge
            variant="outline"
            className={cn("text-[10px] mt-1", CATEGORY_COLORS[category])}
          >
            {c.hardware.categories[
              category as keyof typeof c.hardware.categories
            ]?.value ?? category}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ─── HardwareTab ──────────────────────────────────────────────────────────────

export function HardwareTab({
  items,
  onRefresh,
}: {
  items: HardwareItem[];
  onRefresh: () => void;
}) {
  const c = useIntlayer("inventory");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<HardwareItem | null>(null);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q);
    const matchCat = !filterCategory || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStockCount = items.filter((i) => {
    const qty = i.quantity ?? 0;
    return (
      i.alertThreshold !== null &&
      i.alertThreshold !== undefined &&
      qty <= i.alertThreshold
    );
  }).length;

  const handleDelete = async (id: string) => {
    if (!confirm(c.hardware.toast.confirmDelete.value)) return;
    try {
      const res = await fetch(`${SITE_URL}/api/extras/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error("Falha ao eliminar");
      toast({ title: c.hardware.toast.deleted.value });
      onRefresh();
    } catch (e: any) {
      toast({
        title: c.hardware.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {items.length} {c.hardware.items.value}
          </span>
          {lowStockCount > 0 && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <AlertTriangle size={12} />
              {lowStockCount} {c.hardware.lowStock.value}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={c.hardware.searchPlaceholder.value}
              className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors w-40"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="">{c.hardware.allCategories.value}</option>
            <option value="hardware">
              {c.hardware.categories.hardware.value}
            </option>
            <option value="consumable">
              {c.hardware.categories.consumable.value}
            </option>
            <option value="packaging">
              {c.hardware.categories.packaging.value}
            </option>
            <option value="maintenance">
              {c.hardware.categories.maintenance.value}
            </option>
          </select>
          <Button
            size="sm"
            onClick={() => {
              setEditItem(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={14} className="mr-1.5" />
            {c.hardware.addButton.value}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <Wrench size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {c.hardware.empty.title.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {c.hardware.empty.description.value}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <HardwareCard
              key={item.id}
              item={item}
              onEdit={(i) => {
                setEditItem(i);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <HardwareDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        onSaved={onRefresh}
      />
    </div>
  );
}
