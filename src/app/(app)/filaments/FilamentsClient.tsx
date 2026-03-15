"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewFilamentTypeDialog } from "@/components/forms/NewFilamentTypeDialog";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";
import { SpoolAdjustDialog } from "@/components/forms/SpoolAdjustDialog";
import { toast } from "@/components/ui/toaster";

export function FilamentsClient({
  initialTypes,
  initialSpools,
}: {
  initialTypes: any[];
  initialSpools: any[];
}) {
  const [types, setTypes] = useState(initialTypes);
  const [spools, setSpools] = useState(initialSpools);

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

  const handleDeleteType = async (id: string) => {
    if (!confirm("Tens a certeza que queres eliminar este material?")) return;
    try {
      const res = await fetch(`/api/filaments/types/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Material eliminado" });
      refreshData();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpool = async (id: string) => {
    if (!confirm("Eliminar esta bobine do stock?")) return;
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

  return (
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
          {types.map((type) => (
            <Card
              key={type.id}
              className="hover:border-primary/50 transition-colors relative group overflow-hidden"
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
                      style={{
                        backgroundColor: type.colorHex,
                        filter: `drop-shadow(0 0 8px ${type.colorHex})`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-none mb-1 truncate">
                        {type.brand}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {type.material} • {type.colorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {type._count?.spools || 0} rolos
                    </Badge>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coluna 3: Bobines */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Bobines em Stock
          </h2>
          <AddSpoolDialog types={types} onAdded={refreshData} />
        </div>

        <div className="space-y-3">
          {spools
            .filter((s) => s.remaining > 0)
            .map((spool) => (
              <Card
                key={spool.id}
                className="bg-muted/30 border-none relative group"
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

                    {/* ✅ Botões de ação — ajuste + eliminar */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <SpoolAdjustDialog
                        spool={spool}
                        onAdjusted={refreshData}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSpool(spool.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
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
            ))}
        </div>
      </div>
    </div>
  );
}
