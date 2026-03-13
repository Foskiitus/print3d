"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { Droplet, Wrench, Plus, Trash2, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ProductDetailsClient({
  product,
  filamentTypes,
  extras,
}: {
  product: any;
  filamentTypes: any[];
  extras: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [newFilament, setNewFilament] = useState({
    filamentTypeId: "",
    weight: "",
  });
  const [newExtra, setNewExtra] = useState({ extraId: "", quantity: "" });

  async function handleAddFilament(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/filaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filamentTypeId: Number(newFilament.filamentTypeId),
          weight: Number(newFilament.weight),
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Filamento adicionado à receita!" });
      setNewFilament({ filamentTypeId: "", weight: "" });
      router.refresh();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao adicionar filamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExtra(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraId: Number(newExtra.extraId),
          quantity: Number(newExtra.quantity),
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Extra adicionado à receita!" });
      setNewExtra({ extraId: "", quantity: "" });
      router.refresh();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao adicionar extra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(type: "filaments" | "extras", itemId: number) {
    if (!confirm("Remover este item da receita?")) return;
    try {
      await fetch(`/api/products/${product.id}/${type}?itemId=${itemId}`, {
        method: "DELETE",
      });
      toast({ title: "Item removido" });
      router.refresh();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => router.push("/inventory")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Inventário
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PAINEL 1: FILAMENTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Droplet className="w-5 h-5 mr-2 text-blue-500" /> Filamentos
              Usados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={handleAddFilament}
              className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border border-dashed"
            >
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Material</Label>
                <Select
                  value={newFilament.filamentTypeId}
                  onValueChange={(v) =>
                    setNewFilament({ ...newFilament, filamentTypeId: v })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filamentTypes.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.brand} {f.material} ({f.color})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Peso (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  min="0.1"
                  value={newFilament.weight}
                  onChange={(e) =>
                    setNewFilament({ ...newFilament, weight: e.target.value })
                  }
                />
              </div>
              <Button type="submit" size="icon" disabled={loading}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {/* Corrigido para ler product.filamentUsage */}
              {!product.filamentUsage || product.filamentUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum filamento associado.
                </p>
              ) : (
                product.filamentUsage.map((usage: any) => (
                  <div
                    key={usage.id}
                    className="flex justify-between items-center p-3 border rounded-md bg-background"
                  >
                    <span className="text-sm font-medium">
                      {usage.filamentType.brand} {usage.filamentType.material} (
                      {usage.filamentType.color})
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {usage.weight}g
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 h-8 w-8"
                        onClick={() => handleRemove("filaments", usage.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* PAINEL 2: EXTRAS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wrench className="w-5 h-5 mr-2 text-orange-500" /> Peças Extra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={handleAddExtra}
              className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border border-dashed"
            >
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Item Extra</Label>
                <Select
                  value={newExtra.extraId}
                  onValueChange={(v) =>
                    setNewExtra({ ...newExtra, extraId: v })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {extras.map((ex) => (
                      <SelectItem key={ex.id} value={String(ex.id)}>
                        {ex.name} ({formatCurrency(ex.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Qtd</Label>
                <Input
                  type="number"
                  step="1"
                  required
                  min="1"
                  value={newExtra.quantity}
                  onChange={(e) =>
                    setNewExtra({ ...newExtra, quantity: e.target.value })
                  }
                />
              </div>
              <Button type="submit" size="icon" disabled={loading}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {/* Corrigido para ler product.extras */}
              {!product.extras || product.extras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum extra associado.
                </p>
              ) : (
                product.extras.map((usage: any) => (
                  <div
                    key={usage.id}
                    className="flex justify-between items-center p-3 border rounded-md bg-background"
                  >
                    <span className="text-sm font-medium">
                      {usage.extra.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {usage.quantity} un.
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 h-8 w-8"
                        onClick={() => handleRemove("extras", usage.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
