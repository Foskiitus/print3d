"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  X,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewFilamentTypeDialog } from "@/components/forms/NewFilamentTypeDialog";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";
import { SpoolAdjustDialog } from "@/components/forms/SpoolAdjustDialog";
import { toast } from "@/components/ui/toaster";
import { EditFilamentTypeDialog } from "@/components/forms/EditFilamentTypeDialog";
import { cn } from "@/lib/utils";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function FilamentsClient({
  initialTypes,
  initialSpools,
}: {
  initialTypes: any[];
  initialSpools: any[];
}) {
  const router = useRouter();
  const [types, setTypes] = useState(initialTypes);
  const [spools, setSpools] = useState(initialSpools);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);

  const refreshData = async () => {
    try {
      const [resTypes, resSpools] = await Promise.all([
        fetch("/api/filaments/types"),
        fetch("/api/filaments/spools"),
      ]);
      if (resTypes.ok) setTypes(await resTypes.json());
      if (resSpools.ok) setSpools(await resSpools.json());
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
    }
  };

  const handleEditType = (e: React.MouseEvent, type: any) => {
    e.stopPropagation();
    setEditingType(type);
    setEditOpen(true);
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Tens a certeza que queres eliminar este material?")) return;
    try {
      const res = await fetch(`/api/filaments/types/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Material eliminado" });
      if (selectedTypeId === id) setSelectedTypeId(null);
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpool = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Eliminar esta bobine?")) return;
    try {
      const res = await fetch(`/api/filaments/spools/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Bobine removida" });
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTypeClick = (typeId: string) => {
    setSelectedTypeId((prev) => (prev === typeId ? null : typeId));
    setHistoryOpen(true);
  };

  const selectedType = types.find((t) => t.id === selectedTypeId);
  const filteredSpools = selectedTypeId
    ? spools.filter((s) => s.filamentTypeId === selectedTypeId)
    : spools;
  const activeSpools = filteredSpools.filter((s) => s.remaining > 0);
  const emptySpools = filteredSpools
    .filter((s) => s.remaining <= 0)
    .sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    );

  return (
    <div className="space-y-8">
      <EditFilamentTypeDialog
        type={editingType}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={refreshData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Catálogo de materiais ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Catálogo de Materiais
            </h2>
            <NewFilamentTypeDialog onCreated={refreshData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map((type) => {
              const isSelected = selectedTypeId === type.id;
              const activeCount = spools.filter(
                (s) => s.filamentTypeId === type.id && s.remaining > 0,
              ).length;

              const typeSpools = spools.filter(
                (s) => s.filamentTypeId === type.id,
              );
              const hasSpools = typeSpools.length > 0;
              const hasConsumption = typeSpools.some(
                (s) => s.remaining < s.spoolWeight,
              );
              const canDeleteType = !hasSpools && !hasConsumption;
              const totalRemaining = spools
                .filter((s) => s.filamentTypeId === type.id && s.remaining > 0)
                .reduce((sum, s) => sum + s.remaining, 0);
              const isLow =
                type.alertThreshold != null &&
                totalRemaining <= type.alertThreshold;

              return (
                <Card
                  key={type.id}
                  className={cn(
                    "transition-all relative group overflow-hidden cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50",
                  )}
                  onClick={() => handleTypeClick(type.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: type.colorHex,
                            filter: `drop-shadow(0 0 8px ${type.colorHex})`,
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm leading-none mb-1 truncate">
                            {type.brand}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {type.material} • {type.colorName}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              variant={isSelected ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {activeCount} rolo(s)
                            </Badge>
                            {totalRemaining > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {totalRemaining.toFixed(0)}g
                                {isLow && (
                                  <span className="text-warning ml-1">
                                    ⚠ stock baixo
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações — visíveis no hover */}
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleEditType(e, type)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {canDeleteType && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteType(type.id);
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {types.length === 0 && (
              <div className="md:col-span-2 border border-dashed rounded-lg py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum material criado ainda.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Bobines em stock ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Bobines em Stock
              </h2>
              {selectedType && (
                <button
                  onClick={() => setSelectedTypeId(null)}
                  className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <span>{selectedType.colorName}</span>
                  <X size={10} className="flex-shrink-0" />
                </button>
              )}
            </div>
            <div className="flex-shrink-0">
              <AddSpoolDialog types={types} onAdded={refreshData} />
            </div>
          </div>

          <div className="space-y-3">
            {activeSpools.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                {selectedTypeId
                  ? "Nenhuma bobine em stock para este material."
                  : "Nenhuma bobine em stock."}
              </p>
            )}

            {activeSpools.map((spool) => {
              const hasAdjustments = spool._count?.adjustments > 0;
              const hasConsumption = spool.remaining < spool.spoolWeight;
              const canDelete = !hasAdjustments && !hasConsumption;
              const pct = Math.min(
                100,
                (spool.remaining / spool.spoolWeight) * 100,
              );
              const isLow = pct < 20;

              return (
                <Card
                  key={spool.id}
                  className="bg-secondary border border-border relative group cursor-pointer hover:border-primary/30 hover:bg-secondary/80 transition-colors"
                  onClick={() => router.push(`/filaments/spools/${spool.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: spool.filamentType.colorHex,
                            boxShadow: `0 0 8px ${spool.filamentType.colorHex}`,
                          }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">
                            {spool.filamentType.brand}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {spool.filamentType.colorName}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SpoolAdjustDialog
                          spool={spool}
                          onAdjusted={refreshData}
                        />
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteSpool(e, spool.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span
                          className={cn(
                            "font-medium",
                            isLow ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {spool.remaining}g / {spool.spoolWeight}g
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {formatCurrency(spool.price)}
                        </span>
                      </div>
                      <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isLow
                              ? "hsl(var(--warning))"
                              : spool.filamentType.colorHex,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Histórico de bobines vazias ── */}
      {emptySpools.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <History size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Histórico de Bobines
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {emptySpools.length}
            </Badge>
            {selectedType && (
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30"
              >
                {selectedType.colorName}
              </Badge>
            )}
            <span className="ml-auto text-muted-foreground">
              {historyOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </span>
          </button>

          {historyOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {emptySpools.map((spool) => {
                const hasAdjustments = spool._count?.adjustments > 0;
                const hasConsumption = spool.remaining < spool.spoolWeight;
                const canDelete = !hasAdjustments && !hasConsumption;
                return (
                  <Card
                    key={spool.id}
                    className="bg-secondary/50 border border-dashed cursor-pointer hover:bg-secondary/70 transition-colors group"
                    onClick={() => router.push(`/filaments/spools/${spool.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 opacity-50"
                            style={{
                              backgroundColor: spool.filamentType.colorHex,
                            }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate text-muted-foreground">
                              {spool.filamentType.brand}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70 truncate">
                              {spool.filamentType.colorName}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteSpool(e, spool.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          {spool.spoolWeight}g · {formatCurrency(spool.price)}
                        </span>
                        <span>{formatDate(spool.purchaseDate)}</span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-1 mt-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
