"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplet, Plus, History, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewFilamentTypeDialog } from "@/components/forms/NewFilamentTypeDialog";
import { AddSpoolDialog } from "@/components/forms/AddSpoolDialog";
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
    const resTypes = await fetch("/api/filaments/types");
    const resSpools = await fetch("/api/filaments/spools");
    setTypes(await resTypes.json());
    setSpools(await resSpools.json());
  };

  const handleDeleteType = async (id: number) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna 1 e 2: Tipos de Filamento */}
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
              className="hover:border-primary/50 transition-colors relative group"
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border shadow-sm"
                      style={{
                        backgroundColor: type.colorHex.startsWith("#")
                          ? type.colorHex
                          : "#ccc",
                      }}
                    />
                    <div>
                      <p className="font-semibold">{type.brand}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.material} • {type.colorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {type._count?.spools || 0} rolos
                    </Badge>

                    {/* Botão de Eliminar - Aparece ao passar o rato (group-hover) */}
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

      {/* Coluna 3: Inventário de Bobines (Spools) */}
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
              <Card key={spool.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white/10"
                      style={{
                        backgroundColor: spool.filamentType.colorHex,
                        boxShadow: `0 0 8px ${spool.filamentType.colorHex}`,
                      }}
                    />
                    <span className="text-xs font-bold truncate pr-2">
                      {spool.filamentType.brand} {spool.filamentType.colorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(spool.price)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{
                        width: `${(spool.remaining / spool.spoolWeight) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{spool.remaining}g restantes</span>
                    <span>
                      {((spool.remaining / spool.spoolWeight) * 100).toFixed(0)}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          {spools.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
              Sem bobines registadas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
