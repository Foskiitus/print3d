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
  Plus,
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
  };

  // ─── Dados derivados ──────────────────────────────────────────────────────
  const selectedType = types.find((t) => t.id === selectedTypeId);

  // Agrupar tipos por marca
  const brands = [...new Set(types.map((t) => t.brand))].sort();

  // Bobines filtradas por tipo selecionado
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

      {/* ── Catálogo de Materiais ── */}
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Catálogo de Materiais
          </h2>
          <NewFilamentTypeDialog onCreated={refreshData} />
        </div>

        {types.length === 0 ? (
          <div className="border border-dashed rounded-lg py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum material criado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {brands.map((brand) => {
              const brandTypes = types.filter((t) => t.brand === brand);
              return (
                <div key={brand}>
                  {/* ── Label da marca ── */}
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                    {brand}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {brandTypes.length} material(ais)
                    </span>
                  </p>

                  {/* ── Cards compactos ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {brandTypes.map((type) => {
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
                      const totalRemaining = typeSpools
                        .filter((s) => s.remaining > 0)
                        .reduce((sum, s) => sum + s.remaining, 0);
                      const isLow =
                        type.alertThreshold != null &&
                        totalRemaining <= type.alertThreshold;

                      return (
                        <div
                          key={type.id}
                          onClick={() => handleTypeClick(type.id)}
                          className={cn(
                            "relative group cursor-pointer rounded-xl border px-3 py-2.5 transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-accent/40",
                          )}
                        >
                          {/* Dot de cor + nome */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: type.colorHex,
                                boxShadow: `0 0 6px ${type.colorHex}88`,
                              }}
                            />
                            <span className="text-xs font-medium truncate text-foreground leading-none">
                              {type.colorName}
                            </span>
                          </div>

                          {/* Material */}
                          <p className="text-[10px] text-muted-foreground truncate mb-1.5">
                            {type.material}
                          </p>

                          {/* Badges */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              className={cn(
                                "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                                isSelected
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {activeCount} rolo(s)
                            </span>
                            {isLow && (
                              <span className="text-[9px] text-warning">⚠</span>
                            )}
                          </div>

                          {/* Ações no hover */}
                          <div
                            className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              onClick={(e) => handleEditType(e, type)}
                            >
                              <Pencil size={10} />
                            </button>
                            {canDeleteType && (
                              <button
                                className="w-5 h-5 rounded flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteType(type.id);
                                }}
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bobines em Stock ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Bobines em Stock
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {activeSpools.length}
            </Badge>
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
          <AddSpoolDialog types={types} onAdded={refreshData} />
        </div>

        {activeSpools.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
            {selectedTypeId
              ? "Nenhuma bobine em stock para este material."
              : "Nenhuma bobine em stock."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: spool.filamentType.colorHex,
                            boxShadow: `0 0 6px ${spool.filamentType.colorHex}`,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-foreground leading-none">
                            {spool.filamentType.brand}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {spool.filamentType.colorName}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-0.5 flex-shrink-0"
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
                            className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteSpool(e, spool.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span
                          className={cn(
                            "font-medium",
                            isLow ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {spool.remaining}g / {spool.spoolWeight}g
                        </span>
                        <span className="text-muted-foreground">
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
        )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
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
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate text-muted-foreground">
                              {spool.filamentType.brand}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 truncate">
                              {spool.filamentType.colorName}
                            </p>
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
