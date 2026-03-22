"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntlayer, useLocale } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
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
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Individual spool card ────────────────────────────────────────────────────
function SpoolCard({
  spool,
  onAdjusted,
  onDelete,
  onClick,
}: {
  spool: any;
  onAdjusted: () => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
}) {
  const hasAdjustments = spool._count?.adjustments > 0;
  const hasConsumption = spool.remaining < spool.spoolWeight;
  const canDelete = !hasAdjustments && !hasConsumption;
  const pct = Math.min(100, (spool.remaining / spool.spoolWeight) * 100);
  const isLow = pct < 20;

  return (
    <div
      onClick={onClick}
      className="bg-secondary border border-border rounded-lg p-2.5 cursor-pointer hover:border-primary/30 hover:bg-secondary/80 transition-colors group relative"
    >
      <div className="flex items-center justify-between gap-1 mb-2">
        <span
          className={cn(
            "text-[10px] font-medium",
            isLow ? "text-warning" : "text-muted-foreground",
          )}
        >
          {spool.remaining}g / {spool.spoolWeight}g
        </span>
        <div
          className="flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <SpoolAdjustDialog spool={spool} onAdjusted={onAdjusted} />
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => onDelete(e, spool.id)}
            >
              <Trash2 size={10} />
            </Button>
          )}
        </div>
      </div>

      <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden mb-1.5">
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

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatCurrency(spool.price)}</span>
        <span>{formatDate(spool.purchaseDate)}</span>
      </div>
    </div>
  );
}

// ─── FilamentsClient ──────────────────────────────────────────────────────────
export function FilamentsClient({
  initialTypes,
  initialSpools,
}: {
  initialTypes: any[];
  initialSpools: any[];
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const c = useIntlayer("filaments");
  const [types, setTypes] = useState(initialTypes);
  const [spools, setSpools] = useState(initialSpools);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);

  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleType = (typeId: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

  const refreshData = async () => {
    try {
      const [resTypes, resSpools] = await Promise.all([
        fetch("/api/filaments/types"),
        fetch("/api/filaments/spools"),
      ]);
      if (resTypes.ok) setTypes(await resTypes.json());
      if (resSpools.ok) setSpools(await resSpools.json());
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  const handleEditType = (e: React.MouseEvent, type: any) => {
    e.stopPropagation();
    setEditingType(type);
    setEditOpen(true);
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm(c.toast.confirmDeleteMaterial.value)) return;
    try {
      const res = await fetch(`/api/filaments/types/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.materialDeleted.value });
      refreshData();
    } catch (error: any) {
      toast({
        title: c.toast.deleteError.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpool = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(c.toast.confirmDeleteSpool.value)) return;
    try {
      const res = await fetch(`/api/filaments/spools/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.spoolDeleted.value });
      refreshData();
    } catch (error: any) {
      toast({
        title: c.toast.deleteError.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // ─── Hierarchy ────────────────────────────────────────────────────────────
  const brands = [...new Set(types.map((t) => t.brand))].sort();
  const allSpools = spools;
  const emptySpools = allSpools
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

      {/* ── Material catalogue ── */}
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {c.catalogue.heading.value}
          </h2>
          <div className="flex items-center gap-2">
            <AddSpoolDialog types={types} onAdded={refreshData} />
            <NewFilamentTypeDialog onCreated={refreshData} />
          </div>
        </div>

        {types.length === 0 ? (
          <div className="border border-dashed rounded-lg py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {c.catalogue.empty.value}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {brands.map((brand) => {
              const brandTypes = types.filter((t) => t.brand === brand);
              const materials = [
                ...new Set(brandTypes.map((t) => t.material)),
              ].sort();
              const brandActiveSpools = allSpools.filter(
                (s) =>
                  brandTypes.some((t) => t.id === s.filamentTypeId) &&
                  s.remaining > 0,
              ).length;

              return (
                <div key={brand} className="space-y-3">
                  {/* ── Brand ── */}
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-foreground">{brand}</p>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground">
                      {brandActiveSpools} {c.catalogue.spoolsInStock.value}
                    </span>
                  </div>

                  {/* ── Materials ── */}
                  <div className="space-y-3 pl-2">
                    {materials.map((material) => {
                      const materialTypes = brandTypes.filter(
                        (t) => t.material === material,
                      );

                      return (
                        <div key={material}>
                          {/* ── Material label ── */}
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                            {material}
                          </p>

                          {/* ── Colours ── */}
                          <div className="space-y-2 pl-2">
                            {materialTypes.map((type) => {
                              const isExpanded = expandedTypes.has(type.id);
                              const typeSpools = allSpools.filter(
                                (s) => s.filamentTypeId === type.id,
                              );
                              const activeSpools = typeSpools.filter(
                                (s) => s.remaining > 0,
                              );
                              const hasSpools = typeSpools.length > 0;
                              const hasConsumption = typeSpools.some(
                                (s) => s.remaining < s.spoolWeight,
                              );
                              const canDeleteType =
                                !hasSpools && !hasConsumption;
                              const totalRemaining = activeSpools.reduce(
                                (sum, s) => sum + s.remaining,
                                0,
                              );
                              const isLow =
                                type.alertThreshold != null &&
                                totalRemaining <= type.alertThreshold;

                              return (
                                <div key={type.id}>
                                  {/* ── Colour row ── */}
                                  <div
                                    onClick={() =>
                                      activeSpools.length > 0 &&
                                      toggleType(type.id)
                                    }
                                    className={cn(
                                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all",
                                      activeSpools.length > 0
                                        ? "cursor-pointer"
                                        : "cursor-default opacity-60",
                                      isExpanded
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-border hover:border-primary/30 hover:bg-accent/30",
                                    )}
                                  >
                                    {/* Dot */}
                                    <div
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: type.colorHex,
                                        boxShadow: `0 0 5px ${type.colorHex}88`,
                                      }}
                                    />

                                    {/* Colour name */}
                                    <span className="text-xs font-medium text-foreground flex-1">
                                      {type.colorName}
                                    </span>

                                    {/* Total stock */}
                                    {totalRemaining > 0 && (
                                      <span
                                        className={cn(
                                          "text-[10px] tabular-nums",
                                          isLow
                                            ? "text-warning font-semibold"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {totalRemaining.toFixed(0)}g
                                        {isLow && " ⚠"}
                                      </span>
                                    )}

                                    {/* Spool count badge */}
                                    <span
                                      className={cn(
                                        "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                                        isExpanded
                                          ? "bg-primary/15 text-primary"
                                          : "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {activeSpools.length}{" "}
                                      {c.catalogue.spoolCount.value}
                                    </span>

                                    {/* Chevron */}
                                    {activeSpools.length > 0 && (
                                      <span className="text-muted-foreground/50">
                                        {isExpanded ? (
                                          <ChevronUp size={12} />
                                        ) : (
                                          <ChevronDown size={12} />
                                        )}
                                      </span>
                                    )}

                                    {/* Hover actions */}
                                    <div
                                      className="flex items-center gap-0.5"
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
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <AddSpoolDialog
                                          types={types}
                                          onAdded={refreshData}
                                          trigger={
                                            <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                              <Plus size={10} />
                                            </button>
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── Expanded spools ── */}
                                  {isExpanded && activeSpools.length > 0 && (
                                    <div className="mt-1.5 ml-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                      {activeSpools.map((spool) => (
                                        <SpoolCard
                                          key={spool.id}
                                          spool={spool}
                                          onAdjusted={refreshData}
                                          onDelete={handleDeleteSpool}
                                          onClick={() =>
                                            router.push(
                                              `/${locale}/filaments/spools/${spool.id}`,
                                            )
                                          }
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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

      {/* ── Empty spool history ── */}
      {emptySpools.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <History size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {c.spoolHistory.heading.value}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {emptySpools.length}
            </Badge>
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
                    onClick={() =>
                      router.push(`/${locale}/filaments/spools/${spool.id}`)
                    }
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
                              {spool.filamentType.brand}{" "}
                              {spool.filamentType.material}
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
