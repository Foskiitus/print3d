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
    // Toggle: clicar no mesmo material limpa o filtro
    setSelectedTypeId((prev) => (prev === typeId ? null : typeId));
    // Se há histórico e o filtro está a ser aplicado, abre-o automaticamente
    setHistoryOpen(true);
  };

  const selectedType = types.find((t) => t.id === selectedTypeId);

  // Filtrar por material selecionado (ou mostrar todos se nenhum selecionado)
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
        {/* Coluna 1 e 2: Catálogo */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Catálogo de Materiais
            </h2>
            <NewFilamentTypeDialog onCreated={refreshData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map((type) => {
              const isSelected = selectedTypeId === type.id;
              // ✅ Contar apenas bobines com filamento restante (> 0)
              const activeCount = spools.filter(
                (s) => s.filamentTypeId === type.id && s.remaining > 0,
              ).length;
              // Total de gramas disponível deste tipo
              const totalRemaining = spools
                .filter((s) => s.filamentTypeId === type.id && s.remaining > 0)
                .reduce((sum, s) => sum + s.remaining, 0);

              return (
                <Card
                  key={type.id}
                  className={`transition-all relative group overflow-hidden cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleTypeClick(type.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-2">
                      {/* Lado esquerdo: cor + nome + info */}
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
                          {/* Badge e gramas abaixo do nome */}
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
                                {type.alertThreshold != null &&
                                  totalRemaining <= type.alertThreshold && (
                                    <span className="text-destructive ml-1">
                                      ⚠️
                                    </span>
                                  )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado direito: botões editar + apagar */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex gap-1 flex-shrink-0"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                          onClick={(e) => handleEditType(e, type)}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteType(type.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Indicador de filtro ativo */}
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1 text-[10px] text-primary">
                        <span>A filtrar rolos por este material</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Coluna 3: Bobines ativas */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Bobines em Stock
              </h2>
              <div className="flex-shrink-0">
                <AddSpoolDialog types={types} onAdded={refreshData} />
              </div>
            </div>
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

              return (
                <Card
                  key={spool.id}
                  className="bg-muted/30 border-none relative group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/filaments/spools/${spool.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-4">
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
                        {!hasAdjustments && (
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

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          {spool.remaining}g / {spool.spoolWeight}g
                        </span>
                        <span className="font-bold">
                          {formatCurrency(spool.price)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(spool.remaining / spool.spoolWeight) * 100}%`,
                            backgroundColor: spool.filamentType.colorHex,
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

      {/* ── Secção: Histórico de Bobines Vazias ── */}
      {emptySpools.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <History size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
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

                return (
                  <Card
                    key={spool.id}
                    className="bg-muted/10 border-dashed cursor-pointer hover:bg-muted/20 transition-colors group"
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
                          {!hasAdjustments && (
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

                      <div className="w-full bg-secondary/20 rounded-full h-1 mt-2" />
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
