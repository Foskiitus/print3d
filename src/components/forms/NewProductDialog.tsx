"use client";

import { useState, useEffect } from "react";
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
import { Plus, FileUp, Loader2, Clock, Weight } from "lucide-react";
import JSZip from "jszip";

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    printHours: "0",
    printMinutes: "0",
    recommendedPrice: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then(setCategories);
    }
  }, [open]);

  // Lógica para extrair dados do ficheiro .3mf
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    // Definir o nome do produto automaticamente com base no nome do ficheiro
    const fileName = file.name.replace(".3mf", "");
    setForm((prev) => ({ ...prev, name: fileName }));

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      // Procurar por ficheiros de configuração (Bambu Studio / Orca)
      const configFile =
        contents.file("Metadata/model_settings.config") ||
        contents.file("Config/slice_info.config");

      if (configFile) {
        const text = await configFile.async("text");

        // Regex simples para capturar tempo (em segundos nos XMLs do Bambu)
        const timeMatch =
          text.match(/prediction="(\d+)"/) ||
          text.match(/<total_time>(\d+)<\/total_time>/);
        if (timeMatch) {
          const seconds = parseInt(timeMatch[1]);
          const totalMinutes = Math.floor(seconds / 60);
          setForm((prev) => ({
            ...prev,
            printHours: Math.floor(totalMinutes / 60).toString(),
            printMinutes: (totalMinutes % 60).toString(),
          }));
        }
      }
      toast({
        title: "Dados extraídos!",
        description: "Informações lidas do ficheiro .3mf",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao ler .3mf",
        description: "Não foi possível extrair dados automáticos.",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const totalMinutes =
      Number(form.printHours) * 60 + Number(form.printMinutes);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          printTimeMinutes: totalMinutes,
          recommendedPrice: Number(form.recommendedPrice),
        }),
      });
      if (res.ok) {
        setOpen(false);
        onCreated();
        toast({ title: "Produto adicionado ao catálogo!" });
      }
    } catch (error) {
      toast({ title: "Erro ao gravar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          Novo do .3mf
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar do Slicer (.3mf)</DialogTitle>
        </DialogHeader>

        <div className="border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center justify-center space-y-2 hover:bg-accent/50 transition-colors cursor-pointer relative">
          <input
            type="file"
            accept=".3mf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <FileUp className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Clique ou arraste o ficheiro .3mf
          </p>
          <p className="text-xs text-muted-foreground">
            Extração automática de tempo e nome
          </p>
          {extracting && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Nome do Modelo</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Preço Venda (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.recommendedPrice}
                onChange={(e) =>
                  setForm({ ...form, recommendedPrice: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Horas
              </Label>
              <Input
                type="number"
                value={form.printHours}
                onChange={(e) =>
                  setForm({ ...form, printHours: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Minutos
              </Label>
              <Input
                type="number"
                value={form.printMinutes}
                onChange={(e) =>
                  setForm({ ...form, printMinutes: e.target.value })
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || extracting}
          >
            {loading ? "A processar..." : "Adicionar ao Catálogo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
