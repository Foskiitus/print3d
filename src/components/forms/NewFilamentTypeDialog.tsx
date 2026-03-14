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
import { toast } from "@/components/ui/toaster";
import { Plus } from "lucide-react";

export function NewFilamentTypeDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    brand: "",
    material: "", // Ex: PLA Basic, PLA Matte
    colorName: "", // Ex: 11101 Preto
    colorHex: "#3b82f6", // Cor para o círculo (hexadecimal)
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand || !form.material || !form.colorName || !form.colorHex)
      return;

    setLoading(true);
    try {
      const res = await fetch("/api/filaments/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          material: form.material,
          colorHex: form.colorHex,
          colorName: form.colorName, // Assumindo que adicionaste ou usas material para o texto
        }),
      });

      if (!res.ok) throw new Error();

      toast({ title: "Material adicionado ao catálogo!" });
      setForm({ brand: "", material: "", colorName: "", colorHex: "#3b82f6" });
      setOpen(false);
      onCreated();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao comunicar com a base de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus size={14} className="mr-1.5" />
          Novo Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Novo Filamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Input
              placeholder="Ex: Bambu Lab"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Material</Label>
            <Input
              placeholder="Ex: PLA Basic, PETG, ASA"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <Label>Cor Visual (Glow)</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  className="w-12 h-10 p-1 cursor-pointer"
                  value={form.colorHex}
                  onChange={(e) =>
                    setForm({ ...form, colorHex: e.target.value })
                  }
                />
                <div
                  className="flex-1 rounded-md border flex items-center justify-center text-[10px] font-mono uppercase"
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A processar..." : "Guardar no Catálogo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
