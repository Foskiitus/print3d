"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { CalendarIcon, Plus } from "lucide-react";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// ─── Dot de cor reutilizável ──────────────────────────────────────────────────
function ColorDot({ hex }: { hex: string }) {
  return (
    <div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{
        backgroundColor: hex,
        boxShadow: `0 0 5px ${hex}99`,
      }}
    />
  );
}

export function AddSpoolDialog({
  types,
  onAdded,
  trigger,
  onOpenChange: onOpenChangeProp,
}: {
  types: any[];
  onAdded: () => void;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    filamentTypeId: "",
    spoolWeight: "1000",
    price: "",
    quantity: "1",
    purchaseDate: today,
  });

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    onOpenChangeProp?.(v);
  };

  // Tipo selecionado atualmente (para o trigger)
  const selectedType = types.find((t) => t.id === form.filamentTypeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!form.filamentTypeId || !form.price) return;

    if (form.purchaseDate > today) {
      toast({
        title: "Data inválida",
        description: "A data de compra não pode ser no futuro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/filaments/spools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filamentTypeId: form.filamentTypeId,
          spoolWeight: Number(form.spoolWeight),
          price: Number(form.price),
          quantity: Number(form.quantity),
          purchaseDate: (() => {
            const now = new Date();
            const [year, month, day] = form.purchaseDate.split("-").map(Number);
            return new Date(
              year,
              month - 1,
              day,
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
            ).toISOString();
          })(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast({ title: `${form.quantity} bobine(s) registadas no inventário!` });
      setForm({
        filamentTypeId: "",
        spoolWeight: "1000",
        price: "",
        quantity: "1",
        purchaseDate: today,
      });
      setOpen(false);
      refreshAlerts();
      onAdded();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registar a bobine.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              Entrada de Stock
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Nova Bobine</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tipo de Material</Label>
              <Select
                value={form.filamentTypeId}
                onValueChange={(v) => setForm({ ...form, filamentTypeId: v })}
              >
                {/* ── Trigger: mostra dot + label quando selecionado ── */}
                <SelectTrigger>
                  {selectedType ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ColorDot hex={selectedType.colorHex} />
                      <span className="truncate text-sm">
                        {selectedType.brand} {selectedType.material} (
                        {selectedType.colorName})
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Selecione o material..." />
                  )}
                </SelectTrigger>

                {/* ── Dropdown: cada item com dot de cor ── */}
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2.5">
                        <ColorDot hex={t.colorHex} />
                        <span>
                          {t.brand} {t.material} ({t.colorName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="weight">Peso Líquido (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={form.spoolWeight}
                  onChange={(e) =>
                    setForm({ ...form, spoolWeight: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Preço de Compra (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="1"
                  max="1000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantidade de Bobines</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 flex flex-col mt-2">
              <Label htmlFor="date">Data de Compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.purchaseDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.purchaseDate ? (
                      format(new Date(form.purchaseDate), "PPP", { locale: pt })
                    ) : (
                      <span>Escolha uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-card border shadow-md"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={new Date(form.purchaseDate)}
                    onSelect={(date) => {
                      if (date) {
                        const adjusted = new Date(
                          date.getTime() - date.getTimezoneOffset() * 60000,
                        );
                        setForm({
                          ...form,
                          purchaseDate: adjusted.toISOString().split("T")[0],
                        });
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A registar..." : "Adicionar ao Stock"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
