"use client";

import { useState, useCallback } from "react";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, X, Factory, Package } from "lucide-react";
import { AddProductionDialog } from "@/components/forms/AddProductionDialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { cn } from "@/lib/utils";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function minutesToHM(minutes: number | null) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function ProductionClient({
  initialLogs,
  products,
  printers,
}: {
  initialLogs: any[];
  products: any[];
  printers: any[];
}) {
  const c = useIntlayer("production");
  const [logs, setLogs] = useState(initialLogs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    printHours: "",
    printMinutes: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/production")
      .then((r) => r.json())
      .then(setLogs);
  }, []);

  const startEdit = (log: any) => {
    const totalMinutes = log.printTime ?? 0;
    setEditingId(log.id);
    setEditForm({
      printHours: totalMinutes > 0 ? String(Math.floor(totalMinutes / 60)) : "",
      printMinutes: totalMinutes > 0 ? String(totalMinutes % 60) : "",
      notes: log.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ printHours: "", printMinutes: "", notes: "" });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const printTime =
        (parseInt(editForm.printHours || "0", 10) || 0) * 60 +
        (parseInt(editForm.printMinutes || "0", 10) || 0);

      const res = await fetch(`/api/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printTime: printTime > 0 ? printTime : null,
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
      const res = await fetch(`/api/production/${id}`, { method: "DELETE" });
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

  const thisMonth = new Date().getMonth();

  const totalThisMonth = logs
    .filter((l) => new Date(l.date).getMonth() === thisMonth)
    .reduce((s, l) => s + l.quantity, 0);

  const totalCostThisMonth = logs
    .filter((l) => new Date(l.date).getMonth() === thisMonth)
    .reduce((s, l) => s + (l.totalCost || 0), 0);

  const columns = [
    { label: c.table.columns.date.value, align: "left" },
    { label: c.table.columns.product.value, align: "left" },
    { label: c.table.columns.printer.value, align: "left" },
    { label: c.table.columns.qty.value, align: "right" },
    { label: c.table.columns.time.value, align: "left" },
    { label: c.table.columns.filament.value, align: "left" },
    { label: c.table.columns.totalCost.value, align: "right" },
    { label: c.table.columns.costPerUnit.value, align: "right" },
    { label: c.table.columns.notes.value, align: "left" },
    { label: "", align: "right" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Monthly summary ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {c.summary.producedThisMonth.value}
              </p>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Package size={15} className="text-success" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground leading-none">
              {totalThisMonth}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {c.summary.units.value}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {c.summary.costThisMonth.value}
              </p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Factory size={15} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground leading-none">
              {formatCurrency(totalCostThisMonth)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {c.summary.costSubtitle.value}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Table header ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logs.length} {c.table.totalRecords.value}
        </p>
        <AddProductionDialog
          products={products}
          printers={printers}
          onAdded={refresh}
        />
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {columns.map(({ label, align }) => (
                    <th
                      key={label}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest",
                        align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-muted-foreground text-sm"
                    >
                      {c.table.empty.value}
                    </td>
                  </tr>
                )}
                {logs.map((log) => {
                  const isEditing = editingId === log.id;
                  const costPerUnit =
                    log.totalCost && log.quantity
                      ? log.totalCost / log.quantity
                      : null;

                  return (
                    <tr
                      key={log.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        isEditing ? "bg-primary/5" : "hover:bg-muted/20",
                      )}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(log.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {log.product.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {log.printer?.name ?? "—"}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">
                          +{log.quantity}
                        </span>
                      </td>

                      {/* Time — editable */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <div className="relative w-14">
                              <Input
                                type="number"
                                min="0"
                                value={editForm.printHours}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    printHours: e.target.value,
                                  })
                                }
                                className="pr-6 h-7 text-xs"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                                h
                              </span>
                            </div>
                            <div className="relative w-16">
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                value={editForm.printMinutes}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    printMinutes: e.target.value,
                                  })
                                }
                                className="pr-7 h-7 text-xs"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                                min
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {minutesToHM(log.printTime)}
                          </span>
                        )}
                      </td>

                      {/* Filament */}
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {log.filamentUsed != null
                          ? `${log.filamentUsed}g`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {log.totalCost ? formatCurrency(log.totalCost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs tabular-nums">
                        {costPerUnit ? formatCurrency(costPerUnit) : "—"}
                      </td>

                      {/* Notes — editable */}
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
                            placeholder={c.table.notesPlaceholder.value}
                            className="h-7 text-xs min-w-[120px]"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {log.notes || "—"}
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
                                className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => handleSave(log.id)}
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
                                onClick={() => startEdit(log)}
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(log.id)}
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
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
