"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  Wrench,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
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
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type {
  ProductionOrder,
  Product,
  OrderItem,
} from "../ProductionPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: {
    label: "Rascunho",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  pending: {
    label: "Pendente",
    color: "text-amber-600",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  in_progress: {
    label: "Em Produção",
    color: "text-blue-600",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  assembly: {
    label: "Montagem",
    color: "text-purple-600",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  done: {
    label: "Concluída",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelada",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["in_progress", "cancelled"],
  in_progress: ["assembly", "done", "cancelled"],
  assembly: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

// ─── Needs summary ────────────────────────────────────────────────────────────

function calcNeeds(items: OrderItem[]) {
  const filamentG: Record<string, number> = {};
  const hardwareNeeds: { name: string; qty: number }[] = [];

  for (const item of items) {
    for (const bomEntry of item.product.bom) {
      const profile = bomEntry.component.profiles[0];
      if (!profile) continue;
      for (const f of profile.filaments) {
        const key = `${f.material}${f.colorHex ?? ""}`;
        filamentG[key] =
          (filamentG[key] ?? 0) +
          f.estimatedG * item.quantity * bomEntry.quantity;
      }
    }
  }

  const totalG = Object.values(filamentG).reduce((a, b) => a + b, 0);
  return { totalG, hardwareNeeds };
}

// ─── New Order Dialog ─────────────────────────────────────────────────────────

function NewOrderDialog({
  open,
  onOpenChange,
  products,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  onCreated: () => void;
}) {
  const c = useIntlayer("production");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    [{ productId: "", quantity: 1 }],
  );
  const [origin, setOrigin] = useState<"manual" | "sale">("manual");
  const [notes, setNotes] = useState("");

  function reset() {
    setItems([{ productId: "", quantity: 1 }]);
    setOrigin("manual");
    setNotes("");
  }

  async function handleSubmit() {
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "Adiciona pelo menos um produto",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          items: validItems,
          origin,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.orders.toast.created.value });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
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
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{c.orders.dialog.titleNew.value}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Origem */}
          <div className="space-y-1.5">
            <Label>{c.orders.dialog.origin.value}</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrigin("manual")}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                  origin === "manual"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                <Wrench size={13} />
                {c.orders.origins.manual.value}
              </button>
              <button
                onClick={() => setOrigin("sale")}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                  origin === "sale"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                <ShoppingCart size={13} />
                {c.orders.origins.sale.value}
              </button>
            </div>
          </div>

          {/* Produtos */}
          <div className="space-y-2">
            <Label>{c.orders.dialog.product.value}</Label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <SearchableSelect
                    options={products.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    value={item.productId}
                    onValueChange={(v) =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, productId: v } : it,
                        ),
                      )
                    }
                    placeholder={c.orders.dialog.productPlaceholder.value}
                    searchPlaceholder={c.orders.dialog.productSearch.value}
                  />
                </div>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === i
                          ? { ...it, quantity: Number(e.target.value) }
                          : it,
                      ),
                    )
                  }
                  className="w-20 h-9"
                />
                {items.length > 1 && (
                  <button
                    onClick={() =>
                      setItems((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setItems((prev) => [...prev, { productId: "", quantity: 1 }])
              }
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Plus size={11} /> Adicionar produto
            </button>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>{c.orders.dialog.notes.value}</Label>
            <Input
              placeholder={c.orders.dialog.notesPlaceholder.value}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {c.orders.dialog.cancel.value}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? c.orders.dialog.submitting.value
                : c.orders.dialog.submit.value}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onRefresh,
}: {
  order: ProductionOrder;
  onRefresh: () => void;
}) {
  const c = useIntlayer("production");
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.draft;
  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  const { totalG } = calcNeeds(order.items);
  const isUrgent = order.items.some((i) => (i as any).saleId);

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");
      toast({ title: c.orders.toast.updated.value });
      onRefresh();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!confirm(c.orders.toast.confirmDelete.value)) return;
    try {
      const res = await fetch(`${SITE_URL}/api/production/orders/${order.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error("Falha ao eliminar");
      toast({ title: c.orders.toast.deleted.value });
      onRefresh();
    } catch (e: any) {
      toast({
        title: c.orders.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-colors",
        isUrgent ? "border-amber-500/30" : "border-border",
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground font-mono">
              #{order.reference}
            </span>
            <Badge
              className={cn(
                "text-[10px] px-2 py-0 border",
                status.bg,
                status.color,
              )}
            >
              {status.label}
            </Badge>
            {isUrgent && (
              <Badge className="text-[10px] px-2 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                🚨 {c.planner.urgent.value}
              </Badge>
            )}
          </div>

          {/* Produtos */}
          <div className="mt-1.5 space-y-0.5">
            {order.items.map((item) => (
              <p key={item.id} className="text-xs text-muted-foreground">
                {item.quantity}× {item.product.name}
                {item.completed > 0 && (
                  <span className="text-emerald-600 ml-1">
                    ({item.completed} feitos)
                  </span>
                )}
              </p>
            ))}
          </div>

          {/* Necessidades */}
          {totalG > 0 && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers size={9} />
                {totalG >= 1000
                  ? `${(totalG / 1000).toFixed(2)}kg`
                  : `${Math.round(totalG)}g`}{" "}
                filamento
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(order.createdAt), "dd/MM/yy")}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground"
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Transições de estado */}
      {transitions.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {transitions.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium",
                  cfg.bg,
                  cfg.color,
                  "hover:opacity-80",
                )}
              >
                → {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Detalhes expandidos — print jobs */}
      {expanded && order.printJobs.length > 0 && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Print Jobs ({order.printJobs.length})
          </p>
          {order.printJobs.map((job) => {
            const jobStatus = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
            return (
              <div
                key={job.id}
                className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {job.printer.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {job.items
                      .map((i) => `${i.quantity}× ${i.component.name}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {job.estimatedMinutes && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={9} />
                      {Math.round(job.estimatedMinutes / 60)}h
                    </span>
                  )}
                  <Badge
                    className={cn(
                      "text-[9px] px-1.5 py-0 border",
                      jobStatus.bg,
                      jobStatus.color,
                    )}
                  >
                    {jobStatus.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── OrdersTab ────────────────────────────────────────────────────────────────

export function OrdersTab({
  orders,
  products,
  onRefresh,
}: {
  orders: ProductionOrder[];
  products: Product[];
  onRefresh: () => void;
}) {
  const c = useIntlayer("production");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.reference.toLowerCase().includes(q) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(q));
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder={c.orders.searchPlaceholder.value}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-sm w-44"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="">{c.orders.allStatuses.value}</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          {c.orders.addButton.value}
        </Button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center">
          <ClipboardList
            size={32}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-muted-foreground">
            {c.orders.empty.title.value}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            {c.orders.empty.description.value}
          </p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            {c.orders.addButton.value}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      <NewOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        onCreated={onRefresh}
      />
    </div>
  );
}

// fix missing import
import { ClipboardList } from "lucide-react";
