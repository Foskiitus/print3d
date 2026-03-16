"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { ColorPicker } from "@/components/ui/colorPicker";
import { Lock } from "lucide-react";
import { refreshAlerts } from "@/lib/refreshAlerts";

type FilamentType = {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
  alertThreshold: number | null;
  _count?: { spools: number };
};

export function EditFilamentTypeDialog({
  type,
  open,
  onOpenChange,
  onUpdated,
}: {
  type: FilamentType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#3b82f6",
    alertThreshold: "",
  });

  const hasSpools = (type?._count?.spools ?? 0) > 0;

  useEffect(() => {
    if (type) {
      setForm({
        brand: type.brand,
        material: type.material,
        colorName: type.colorName,
        colorHex: type.colorHex,
        alertThreshold: type.alertThreshold?.toString() ?? "",
      });
    }
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/filaments/types/${type.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Campos bloqueados: envia os originais sem alteração
          brand: form.brand,
          material: form.material,
          // Campos sempre editáveis
          colorHex: form.colorHex,
          colorName: form.colorName,
          alertThreshold: form.alertThreshold
            ? Number(form.alertThreshold)
            : null,
        }),
      });

      if (!res.ok) throw new Error();

      toast({ title: "Material atualizado!" });
      onOpenChange(false);
      refreshAlerts();
      onUpdated();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao atualizar o material.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Material</DialogTitle>
        </DialogHeader>

        {/* Aviso quando há bobines associadas */}
        {hasSpools && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
            <Lock
              size={12}
              className="mt-0.5 flex-shrink-0 text-muted-foreground"
            />
            <span>
              Este material tem bobines associadas. A <strong>Marca</strong> e o{" "}
              <strong>Material</strong> estão bloqueados para proteger o
              histórico de consumo.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Marca — bloqueada se tiver bobines */}
          <div className="space-y-1.5">
            <Label className={hasSpools ? "text-muted-foreground" : ""}>
              Marca
              {hasSpools && (
                <Lock size={11} className="inline ml-1.5 opacity-50" />
              )}
            </Label>
            <Input
              placeholder="Ex: Bambu Lab"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              disabled={hasSpools}
              required
            />
          </div>

          {/* Material — bloqueado se tiver bobines */}
          <div className="space-y-1.5">
            <Label className={hasSpools ? "text-muted-foreground" : ""}>
              Material
              {hasSpools && (
                <Lock size={11} className="inline ml-1.5 opacity-50" />
              )}
            </Label>
            <Input
              placeholder="Ex: PLA Basic, PETG, ASA"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              disabled={hasSpools}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Nome da cor — sempre editável */}
            <div className="space-y-1.5">
              <Label>Nome/Código da Cor</Label>
              <Input
                placeholder="Ex: 11101 Preto"
                value={form.colorName}
                onChange={(e) =>
                  setForm({ ...form, colorName: e.target.value })
                }
                required
              />
            </div>

            {/* Cor visual — sempre editável */}
            <div className="space-y-1.5">
              <Label>Cor Visual (Glow)</Label>
              <div className="flex gap-2">
                <ColorPicker
                  value={form.colorHex}
                  onChange={(color) => setForm({ ...form, colorHex: color })}
                />
                <div
                  className="flex-1 rounded-lg border flex items-center justify-center text-[10px] font-mono uppercase"
                  style={{
                    backgroundColor: form.colorHex,
                    boxShadow: `0 0 10px ${form.colorHex}`,
                    color: "#fff",
                    textShadow: "0 0 2px #000",
                  }}
                >
                  {form.colorHex}
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de stock — sempre editável */}
          <div className="space-y-1.5">
            <Label>
              Alerta de stock mínimo (g){" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              type="number"
              min="0"
              placeholder="Padrão: 500g"
              value={form.alertThreshold}
              onChange={(e) =>
                setForm({ ...form, alertThreshold: e.target.value })
              }
            />
            <p className="text-[10px] text-muted-foreground">
              Recebe um alerta quando o total deste filamento baixar deste
              valor.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
