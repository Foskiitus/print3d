"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewSaleDialog } from "@/components/forms/NewSaleDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchableSelect";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowUpDown,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  ShoppingCart,
  TrendingUp,
  Receipt,
  ClipboardList,
  PackageCheck,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type SortKey = "date" | "salePrice" | "customerName" | "product";
type SortDir = "asc" | "desc";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sale status badge ────────────────────────────────────────────────────────

const SALE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: "Aguarda Produção",
    color: "text-amber-600",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: Clock,
  },
  ready_to_ship: {
    label: "Pronta a Enviar",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: PackageCheck,
  },
  shipped: {
    label: "Enviada",
    color: "text-blue-600",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: ShoppingCart,
  },
  fulfilled: {
    label: "Concluída",
    color: "text-muted-foreground",
    bg: "bg-muted/40 border-border",
    icon: Check,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
    icon: X,
  },
};

function SaleStatusBadge({ status }: { status: string }) {
  const cfg = SALE_STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Badge
      className={cn(
        "text-[10px] px-2 py-0 border flex items-center gap-1 w-fit",
        cfg.bg,
        cfg.color,
      )}
    >
      <Icon size={9} />
      {cfg.label}
    </Badge>
  );
}

// ─── SalesClient ──────────────────────────────────────────────────────────────

export function SalesClient({
  initialSales,
  products,
}: {
  initialSales: any[];
  products: any[];
}) {
  const c = useIntlayer("sales");
  const [sales, setSales] = useState(initialSales);
  const [productsList, setProductsList] = useState(products);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    customerId: "",
    quantity: "",
    salePrice: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [mobileEditSale, setMobileEditSale] = useState<any | null>(null);

  const refresh = useCallback(() => {
    Promise.all([
      fetch(`${SITE_URL}/api/sales`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      }).then((r) => r.json()),
      fetch(`${SITE_URL}/api/sales/products-with-stock`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      }).then((r) => r.json()),
    ]).then(([salesData, productsData]) => {
      setSales(salesData);
      if (Array.isArray(productsData)) setProductsList(productsData);
    });
  }, []);

  useEffect(() => {
    fetch(`${SITE_URL}/api/customers`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  const startEdit = (sale: any) => {
    setEditingId(sale.id);
    setEditForm({
      customerId: sale.customerId ?? "none",
      quantity: String(sale.quantity),
      salePrice: String(sale.salePrice),
      notes: sale.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ customerId: "", quantity: "", salePrice: "", notes: "" });
  };

  const handleSave = async (sale: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${SITE_URL}/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          customerId:
            editForm.customerId === "none" ? null : editForm.customerId || null,
          quantity: Number(editForm.quantity),
          salePrice: Number(editForm.salePrice),
          notes: editForm.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.updated.value });
      cancelEdit();
      refresh();
      refreshAlerts();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(c.toast.confirmDelete.value)) return;
    try {
      const res = await fetch(`${SITE_URL}/api/sales/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.deleted.value });
      refresh();
      refreshAlerts();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sales
      .filter(
        (s) =>
          !q ||
          (s.customerName || "").toLowerCase().includes(q) ||
          s.product.name.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date")
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sortKey === "salePrice")
          cmp = a.salePrice * a.quantity - b.salePrice * b.quantity;
        else if (sortKey === "customerName")
          cmp = (a.customerName || "").localeCompare(b.customerName || "");
        else if (sortKey === "product")
          cmp = a.product.name.localeCompare(b.product.name);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [sales, search, sortKey, sortDir]);

  const totalRevenue = filtered.reduce(
    (s, x) => s + x.salePrice * x.quantity,
    0,
  );
  const totalProfit = filtered.reduce((s, x) => {
    const costPerUnit = x.costPerUnit ?? 0;
    return s + (x.salePrice - costPerUnit) * x.quantity;
  }, 0);

  // Contagem de vendas pendentes (aguardam produção)
  const pendingCount = sales.filter((s) => s.status === "pending").length;

  function SortButton({ col }: { col: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <ArrowUpDown
          size={11}
          className={sortKey === col ? "text-primary" : ""}
        />
      </button>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: c.summary.transactions.value,
            value: String(filtered.length),
            icon: ShoppingCart,
            color: "bg-primary/10 text-primary",
          },
          {
            label: c.summary.totalRevenue.value,
            value: formatCurrency(totalRevenue),
            icon: Receipt,
            color: "bg-info/10 text-info",
          },
          {
            label: c.summary.estimatedProfit.value,
            value: formatCurrency(totalProfit),
            icon: TrendingUp,
            color: "bg-success/10 text-success",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {label}
                </p>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    color,
                  )}
                >
                  <Icon size={15} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-foreground leading-none">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aviso de encomendas a aguardar produção */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-700">
          <ClipboardList size={15} className="flex-shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">{pendingCount}</span>{" "}
            {pendingCount === 1
              ? "encomenda aguarda produção — uma OP foi gerada automaticamente."
              : "encomendas aguardam produção — OPs foram geradas automaticamente."}
          </p>
          <a
            href="../production"
            className="ml-auto text-xs font-medium underline underline-offset-2 flex-shrink-0"
          >
            Ver produção →
          </a>
        </div>
      )}

      {/* ── Search + button ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={c.search.placeholder.value}
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NewSaleDialog products={productsList} onCreated={refresh} />
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="border border-dashed rounded-lg py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? c.table.emptySearch.value : c.table.emptyAll.value}
            </p>
          </div>
        ) : (
          filtered.map((sale) => {
            const total = sale.salePrice * sale.quantity;
            const costPerUnit = sale.costPerUnit ?? 0;
            const profit = (sale.salePrice - costPerUnit) * sale.quantity;
            const hasRealCost = sale.costPerUnit != null;

            return (
              <Card key={sale.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2 w-full">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {sale.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {formatDate(sale.date)}
                        {(sale.customer?.name ?? sale.customerName) && (
                          <> · {sale.customer?.name ?? sale.customerName}</>
                        )}
                      </p>
                      {/* Status badge no mobile */}
                      {sale.status && sale.status !== "fulfilled" && (
                        <div className="mt-1">
                          <SaleStatusBadge status={sale.status} />
                        </div>
                      )}
                      {/* Link para a OP gerada (se existir) */}
                      {sale.productionOrder && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <ClipboardList size={9} />
                          OP {sale.productionOrder.reference}
                          {" · "}
                          {sale.productionOrder.status}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground"
                        onClick={() => {
                          setMobileEditSale(sale);
                          setEditForm({
                            customerId: sale.customerId ?? "none",
                            quantity: String(sale.quantity),
                            salePrice: String(sale.salePrice),
                            notes: sale.notes ?? "",
                          });
                        }}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(sale.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2 w-full">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity} × {formatCurrency(sale.salePrice)}
                      </p>
                      {sale.notes && (
                        <p className="text-[10px] text-muted-foreground italic truncate max-w-[160px]">
                          {sale.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold tabular-nums">
                        {formatCurrency(total)}
                      </p>
                      {hasRealCost && (
                        <p
                          className={cn(
                            "text-xs tabular-nums font-medium",
                            profit >= 0 ? "text-success" : "text-destructive",
                          )}
                        >
                          {profit >= 0 ? "+" : ""}
                          {formatCurrency(profit)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Mobile edit dialog */}
        <Dialog
          open={!!mobileEditSale}
          onOpenChange={(v) => {
            if (!v) setMobileEditSale(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{c.mobileDialog.title.value}</DialogTitle>
            </DialogHeader>
            {mobileEditSale && (
              <div className="space-y-4 mt-2">
                <div className="px-3 py-2 rounded-lg bg-muted/30 text-sm space-y-0.5">
                  <p className="font-medium text-foreground">
                    {mobileEditSale.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(mobileEditSale.date)}
                  </p>
                  {mobileEditSale.status && (
                    <SaleStatusBadge status={mobileEditSale.status} />
                  )}
                  {(() => {
                    const p = productsList.find(
                      (p) => p.id === mobileEditSale.productId,
                    );
                    const stock = (p?.stock ?? 0) + mobileEditSale.quantity;
                    return (
                      <p
                        className={cn(
                          "text-xs font-medium",
                          stock <= 0
                            ? "text-destructive"
                            : stock <= 3
                              ? "text-warning"
                              : "text-muted-foreground",
                        )}
                      >
                        {c.mobileDialog.stockAvailable.value}: {stock}{" "}
                        {c.mobileDialog.units.value}
                      </p>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{c.mobileDialog.quantity.value}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm({ ...editForm, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{c.mobileDialog.pricePerUnit.value}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.salePrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, salePrice: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {c.mobileDialog.customerLabel.value}{" "}
                    <span className="text-muted-foreground font-normal">
                      {c.mobileDialog.optional.value}
                    </span>
                  </Label>
                  <SearchableSelect
                    options={[
                      {
                        value: "none",
                        label: c.mobileDialog.noCustomer.value,
                      },
                      ...customers.map((cust) => ({
                        value: cust.id,
                        label: cust.name,
                      })),
                    ]}
                    value={editForm.customerId || "none"}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, customerId: v })
                    }
                    placeholder={c.mobileDialog.selectCustomer.value}
                    searchPlaceholder={c.mobileDialog.searchCustomer.value}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {c.mobileDialog.notesLabel.value}{" "}
                    <span className="text-muted-foreground font-normal">
                      {c.mobileDialog.optional.value}
                    </span>
                  </Label>
                  <Input
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder={c.mobileDialog.notesPlaceholder.value}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMobileEditSale(null)}
                    disabled={saving}
                  >
                    {c.mobileDialog.cancel.value}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      await handleSave(mobileEditSale);
                      setMobileEditSale(null);
                    }}
                    disabled={saving}
                  >
                    {saving
                      ? c.mobileDialog.saving.value
                      : c.mobileDialog.save.value}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Desktop table ── */}
      <Card className="overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      {c.table.date.value} <SortButton col="date" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      {c.table.product.value} <SortButton col="product" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      {c.table.customer.value} <SortButton col="customerName" />
                    </span>
                  </th>
                  {/* Coluna Estado — nova */}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.qty.value}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1 justify-end">
                      {c.table.pricePerUnit.value}{" "}
                      <SortButton col="salePrice" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.total.value}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.profit.value}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {c.table.notes.value}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => {
                  const isEditing = editingId === sale.id;
                  const qty = isEditing
                    ? Number(editForm.quantity) || sale.quantity
                    : sale.quantity;
                  const price = isEditing
                    ? Number(editForm.salePrice) || sale.salePrice
                    : sale.salePrice;
                  const total = price * qty;
                  const costPerUnit = sale.costPerUnit ?? 0;
                  const profit = (price - costPerUnit) * qty;
                  const hasRealCost = sale.costPerUnit != null;

                  return (
                    <tr
                      key={sale.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        isEditing ? "bg-primary/5" : "hover:bg-muted/20",
                      )}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {sale.product.name}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={editForm.customerId}
                            onValueChange={(v) =>
                              setEditForm({ ...editForm, customerId: v })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs min-w-[140px]">
                              <SelectValue
                                placeholder={c.edit.selectPlaceholder.value}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {c.edit.noCustomer.value}
                              </SelectItem>
                              {customers.map((cust) => (
                                <SelectItem key={cust.id} value={cust.id}>
                                  {cust.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {sale.customer?.name ?? sale.customerName ?? "—"}
                          </span>
                        )}
                      </td>

                      {/* Estado + link para OP */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <SaleStatusBadge
                            status={sale.status ?? "fulfilled"}
                          />
                          {sale.productionOrder && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <ClipboardList size={9} />
                              {sale.productionOrder.reference}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                quantity: e.target.value,
                              })
                            }
                            className="h-7 text-xs w-16 text-right ml-auto"
                          />
                        ) : (
                          <span className="text-muted-foreground tabular-nums">
                            {sale.quantity}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.salePrice}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                salePrice: e.target.value,
                              })
                            }
                            className="h-7 text-xs w-20 text-right ml-auto"
                          />
                        ) : (
                          formatCurrency(sale.salePrice)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(total)}
                      </td>

                      {/* Profit */}
                      <td className="px-4 py-3 text-right tabular-nums">
                        {hasRealCost ? (
                          <span
                            className={
                              profit >= 0
                                ? "text-success font-medium"
                                : "text-destructive font-medium"
                            }
                          >
                            {formatCurrency(profit)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {c.table.noData.value}
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                notes: e.target.value,
                              })
                            }
                            placeholder={c.edit.notesPlaceholder.value}
                            className="h-7 text-xs min-w-[120px]"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {sale.notes || "—"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary hover:bg-primary/10"
                                onClick={() => handleSave(sale)}
                                disabled={saving}
                              >
                                <Check size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground"
                                onClick={cancelEdit}
                                disabled={saving}
                              >
                                <X size={13} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground"
                                onClick={() => startEdit(sale)}
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(sale.id)}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-muted-foreground text-sm"
                    >
                      {search
                        ? c.table.emptySearch.value
                        : c.table.emptyAll.value}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
