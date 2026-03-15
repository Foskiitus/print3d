"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { AddProductionDialog } from "@/components/forms/AddProductionDialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
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
  const [logs, setLogs] = useState(initialLogs);

  // Estado da linha em edição
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

      toast({ title: "Registo atualizado" });
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
    if (!confirm("Apagar este registo?")) return;
    try {
      const res = await fetch(`/api/production/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Registo apagado" });
      refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalThisMonth = logs
    .filter((l) => new Date(l.date).getMonth() === new Date().getMonth())
    .reduce((s, l) => s + l.quantity, 0);

  const totalCostThisMonth = logs
    .filter((l) => new Date(l.date).getMonth() === new Date().getMonth())
    .reduce((s, l) => s + (l.totalCost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Resumo do mês */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Produzido este mês
            </p>
            <p className="text-2xl font-bold">{totalThisMonth}</p>
            <p className="text-xs text-muted-foreground">unidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Custo este mês
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalCostThisMonth)}
            </p>
            <p className="text-xs text-muted-foreground">
              em materiais e máquina
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logs.length} registo(s) no total
        </p>
        <AddProductionDialog
          products={products}
          printers={printers}
          onAdded={refresh}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Data
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Produto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Impressora
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Qtd
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tempo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Filamento
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Custo total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Custo/un
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Notas
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isEditing = editingId === log.id;
                  const costPerUnit =
                    log.totalCost && log.quantity
                      ? log.totalCost / log.quantity
                      : null;

                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-border last:border-0 transition-colors ${
                        isEditing ? "bg-primary/5" : "hover:bg-accent/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.date)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {log.product.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.printer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant="secondary"
                          className="text-emerald-400 font-medium"
                        >
                          +{log.quantity}
                        </Badge>
                      </td>

                      {/* Tempo — editável */}
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
                          <span className="text-muted-foreground">
                            {minutesToHM(log.printTime)}
                          </span>
                        )}
                      </td>

                      {/* Filamento — só leitura */}
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {log.filamentUsed != null
                            ? `${log.filamentUsed}g`
                            : "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {log.totalCost ? formatCurrency(log.totalCost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {costPerUnit ? formatCurrency(costPerUnit) : "—"}
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
                          <span className="text-muted-foreground">
                            {log.notes || "—"}
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
                                className="h-7 w-7 text-primary hover:text-primary"
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
                                className="h-7 w-7 text-destructive/40 hover:text-destructive"
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
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                    >
                      Nenhuma produção registada ainda.
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
