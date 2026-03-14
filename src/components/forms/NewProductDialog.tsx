"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import {
  Plus,
  FileUp,
  Loader2,
  Clock,
  Weight,
  Trash2,
  Calculator,
} from "lucide-react";
import JSZip from "jszip";
import { calculateProductionCosts, formatCurrency } from "@/lib/utils";

export function NewProductDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [filamentTypes, setFilamentTypes] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    printerId: "",
    printHours: "0",
    printMinutes: "0",
    margin: "100",
  });

  const [usages, setUsages] = useState([{ filamentTypeId: "", weight: "0" }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/categories").then((res) => res.json()),
        fetch("/api/printers").then((res) => res.json()),
        fetch("/api/filaments/types").then((res) => res.json()),
      ]).then(([cats, prnts, types]) => {
        setCategories(cats);
        setPrinters(prnts);
        setFilamentTypes(types);
      });
    }
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file); // NOVO: Guarda o ficheiro real na memória
    setExtracting(true);
    setForm((prev) => ({ ...prev, name: file.name.replace(".3mf", "") }));

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const configFile =
        contents.file("Metadata/model_settings.config") ||
        contents.file("Config/slice_info.config");

      if (configFile) {
        const text = await configFile.async("text");
        const timeMatch =
          text.match(/prediction="(\d+)"/) ||
          text.match(/<total_time>(\d+)<\/total_time>/);
        if (timeMatch) {
          const totalMins = Math.floor(parseInt(timeMatch[1]) / 60);
          setForm((prev) => ({
            ...prev,
            printHours: Math.floor(totalMins / 60).toString(),
            printMinutes: (totalMins % 60).toString(),
          }));
        }

        const weightMatch =
          text.match(/filament_weight="([\d.]+)"/) ||
          text.match(/<filament_weight>([\d.]+)<\/filament_weight>/);
        if (weightMatch) {
          setUsages([
            {
              filamentTypeId: "",
              weight: Math.ceil(parseFloat(weightMatch[1])).toString(),
            },
          ]);
        }
      }
      toast({ title: "Dados extraídos do .3mf" });
    } catch (err) {
      toast({ title: "Erro ao ler ficheiro", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const addColor = () =>
    setUsages([...usages, { filamentTypeId: "", weight: "0" }]);
  const removeColor = (index: number) =>
    usages.length > 1 && setUsages(usages.filter((_, i) => i !== index));
  const updateUsage = (index: number, field: string, value: string) => {
    const newUsages = [...usages];
    newUsages[index] = { ...newUsages[index], [field]: value };
    setUsages(newUsages);
  };

  const selectedPrinter = printers.find((p) => p.id === Number(form.printerId));
  const totalMinutes = Number(form.printHours) * 60 + Number(form.printMinutes);

  const calculatedCosts =
    selectedPrinter &&
    totalMinutes > 0 &&
    usages.every((u) => u.filamentTypeId && Number(u.weight) > 0)
      ? usages.reduce(
          (acc, usage) => {
            const type = filamentTypes.find(
              (t) => t.id === Number(usage.filamentTypeId),
            );
            const spool = type?.spools?.[0];
            if (!spool) return acc;

            const partial = calculateProductionCosts({
              printTimeMinutes: totalMinutes / usages.length,
              weightGrams: Number(usage.weight),
              spoolPrice: spool.price,
              spoolWeightGrams: spool.spoolWeight,
              printerWattage: selectedPrinter.electricity / usages.length,
              printerHourlyCost: selectedPrinter.hourlyCost / usages.length,
            });
            return {
              total: acc.total + partial.totalCost,
              filament: acc.filament + partial.filamentCost,
            };
          },
          { total: 0, filament: 0 },
        )
      : null;

  const suggestedPrice = calculatedCosts
    ? calculatedCosts.total * (1 + Number(form.margin) / 100)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Usamos FormData em vez de JSON.stringify
      const formData = new FormData();
      formData.append("name", form.name);
      if (form.categoryId) formData.append("categoryId", form.categoryId);
      formData.append("printerId", form.printerId);
      formData.append("printTimeMinutes", totalMinutes.toString());
      formData.append("usages", JSON.stringify(usages));
      formData.append("baseCost", (calculatedCosts?.total || 0).toString());
      formData.append("recommendedPrice", suggestedPrice.toString());

      // Se existir um ficheiro selecionado, anexa-o ao pacote
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // Nota: Quando usamos FormData, NÃO colocamos o header 'Content-Type'.
      // O navegador faz isso automaticamente e define o 'boundary' correto.
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setOpen(false);
        onCreated();
        toast({ title: "Produto Guardado" });
      } else {
        throw new Error();
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
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar e Configurar Produto</DialogTitle>
        </DialogHeader>

        {/* ZONA DE UPLOAD .3MF */}
        <div className="border-2 border-dashed border-muted rounded-xl p-6 flex flex-col items-center justify-center space-y-2 hover:bg-accent/50 transition-colors cursor-pointer relative">
          <input
            type="file"
            accept=".3mf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <FileUp className="w-8 h-8 text-primary/60" />
          <p className="text-sm font-medium text-muted-foreground text-center">
            Arraste o ficheiro .3mf ou clique aqui
          </p>
          {extracting && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>Nome do Modelo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Categoria</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger className="justify-start text-left">
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
          </div>

          {/* AMS / CORES */}
          <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs font-bold uppercase">
                Configuração AMS
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addColor}
                className="h-7 text-[10px] px-2"
              >
                <Plus size={12} className="mr-1" /> Adicionar Cor
              </Button>
            </div>
            {usages.map((usage, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={usage.filamentTypeId}
                    onValueChange={(v) =>
                      updateUsage(index, "filamentTypeId", v)
                    }
                  >
                    <SelectTrigger className="h-9 justify-start text-left">
                      <SelectValue placeholder="Filamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {filamentTypes.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: t.colorHex }}
                            />
                            <span className="truncate">
                              {t.brand} {t.colorName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 relative">
                  <Input
                    type="number"
                    className="h-9 pr-7 text-right"
                    value={usage.weight}
                    onChange={(e) =>
                      updateUsage(index, "weight", e.target.value)
                    }
                  />
                  <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground">
                    g
                  </span>
                </div>
                {usages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() => removeColor(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* TEMPO E MÁQUINA */}
          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Impressora</Label>
              <Select
                value={form.printerId}
                onValueChange={(v) => setForm({ ...form, printerId: v })}
              >
                <SelectTrigger className="justify-start text-left">
                  <SelectValue placeholder="Máquina" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock size={12} /> Horas
              </Label>
              <Input
                type="number"
                value={form.printHours}
                onChange={(e) =>
                  setForm({ ...form, printHours: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock size={12} /> Min
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

          {/* PAINEL FINANCEIRO */}
          {calculatedCosts && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                <span className="text-xs text-muted-foreground">
                  Custo Total (Energia + Amortização + Material)
                </span>
                <span className="font-bold text-primary">
                  {formatCurrency(calculatedCosts.total)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] uppercase font-bold">
                    Margem (%)
                  </Label>
                  <Input
                    type="number"
                    className="h-8"
                    value={form.margin}
                    onChange={(e) =>
                      setForm({ ...form, margin: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    Venda Sugerida
                  </p>
                  <p className="text-xl font-black text-green-600 tracking-tight">
                    {formatCurrency(suggestedPrice)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || extracting}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Calculator className="mr-2" size={16} />
            )}
            Guardar no Catálogo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
