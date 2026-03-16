"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewSaleDialog } from "@/components/forms/NewSaleDialog";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpDown, Search, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "date" | "salePrice" | "customerName" | "product";
type SortDir = "asc" | "desc";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SalesClient({
  initialSales,
  products,
}: {
  initialSales: any[];
  products: any[];
}) {
  const [sales, setSales] = useState(initialSales);
  const [productsList, setProductsList] = useState(products);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Estado de edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    customerId: "",
    quantity: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      fetch("/api/sales").then((r) => r.json()),
      fetch("/api/sales/products-with-stock").then((r) => r.json()),
    ]).then(([salesData, productsData]) => {
      setSales(salesData);
      if (Array.isArray(productsData)) setProductsList(productsData);
    });
  }, []);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  const startEdit = (sale: any) => {
    setEditingId(sale.id);
    setEditForm({
      customerId: sale.customerId ?? "none",
      quantity: String(sale.quantity),
      notes: sale.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ customerId: "", quantity: "", notes: "" });
  };

  const handleSave = async (sale: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId:
            editForm.customerId === "none" ? null : editForm.customerId || null,
          quantity: Number(editForm.quantity),
          notes: editForm.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Venda atualizada" });
      cancelEdit();
      refresh();
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

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar esta venda?")) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Venda apagada" });
      refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
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
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por cliente ou produto..."
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NewSaleDialog products={productsList} onCreated={refresh} />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Transações", value: String(filtered.length) },
          { label: "Receita total", value: formatCurrency(totalRevenue) },
          { label: "Lucro estimado", value: formatCurrency(totalProfit) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg px-4 py-3"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Data <SortButton col="date" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Produto <SortButton col="product" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Cliente <SortButton col="customerName" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Qtd
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1 justify-end">
                      Preço/un <SortButton col="salePrice" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Lucro
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Notas
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => {
                  const isEditing = editingId === sale.id;
                  const qty = isEditing
                    ? Number(editForm.quantity) || sale.quantity
                    : sale.quantity;
                  const total = sale.salePrice * qty;
                  const costPerUnit = sale.costPerUnit ?? 0;
                  const profit = (sale.salePrice - costPerUnit) * qty;
                  const hasRealCost = sale.costPerUnit != null;

                  return (
                    <tr
                      key={sale.id}
                      className={`border-b border-border last:border-0 transition-colors ${
                        isEditing ? "bg-primary/5" : "hover:bg-accent/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {sale.product.name}
                      </td>

                      {/* Cliente — dropdown editável */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={editForm.customerId}
                            onValueChange={(v) =>
                              setEditForm({ ...editForm, customerId: v })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs min-w-[140px]">
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                — Sem cliente —
                              </SelectItem>
                              {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">
                            {sale.customer?.name ?? sale.customerName ?? "—"}
                          </span>
                        )}
                      </td>

                      {/* Quantidade — editável */}
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
                          <span className="text-muted-foreground">
                            {sale.quantity}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(sale.salePrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasRealCost ? (
                          <span
                            className={
                              profit >= 0 ? "text-emerald-400" : "text-red-400"
                            }
                          >
                            {formatCurrency(profit)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            sem dados
                          </span>
                        )}
                      </td>

                      {/* Notas — editável */}
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
                            placeholder="Notas..."
                            className="h-7 text-xs min-w-[120px]"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {sale.notes || "—"}
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary"
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
                                className="h-7 w-7 text-destructive/40 hover:text-destructive"
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
                      colSpan={9}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                    >
                      {search
                        ? "Nenhuma venda encontrada."
                        : "Nenhuma venda registada ainda."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
