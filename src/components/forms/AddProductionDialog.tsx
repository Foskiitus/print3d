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
import { Factory, Loader2 } from "lucide-react";

// Definimos um tipo rápido para as impressoras para não dar erros de TypeScript
type Printer = { id: number; name: string };

// Usamos any genérico no Product caso o teu tipo antigo ainda não tenha os campos novos
export function AddProductionDialog({
  products,
  onAdded,
}: {
  products: any[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [productId, setProductId] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [quantity, setQuantity] = useState("");

  // Estado para guardar as impressoras vindas da API
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  // Carrega as impressoras assim que o Dialog for aberto
  useEffect(() => {
    if (open && printers.length === 0) {
      setLoadingPrinters(true);
      fetch("/api/printers")
        .then((res) => res.json())
        .then((data) => setPrinters(data || []))
        .catch(() =>
          toast({
            title: "Erro",
            description: "Falha ao carregar impressoras.",
            variant: "destructive",
          }),
        )
        .finally(() => setLoadingPrinters(false));
    }
  }, [open, printers.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !printerId || !quantity) return;

    setLoading(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(productId),
          printerId: Number(printerId),
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Lança o erro com a mensagem exata da nossa API (ex: falta de filamento)
        throw new Error(data.error || "Não foi possível registar a produção.");
      }

      const product = products.find((p) => p.id === Number(productId));

      toast({
        title: "Produção registada com sucesso!",
        description: `+${quantity} unidades de "${product?.name}" adicionadas ao stock. Custo total: ${data.totalCost?.toFixed(2)}€`,
        variant: "default",
        className: "bg-green-500 text-white border-none", // Opcional: Para dar um feedback mais positivo
      });

      // Limpa os dados e fecha o pop-up
      setProductId("");
      setPrinterId("");
      setQuantity("");
      setOpen(false);
      onAdded(); // Atualiza a tabela no componente pai
    } catch (error: any) {
      toast({
        title: "Produção Recusada",
        description: error.message,
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
          <Factory size={14} className="mr-1.5" />
          Registar produção
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar Produção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Modelo *</Label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Impressora Usada *</Label>
            <Select
              value={printerId}
              onValueChange={setPrinterId}
              required
              disabled={loadingPrinters}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingPrinters ? "A carregar..." : "Selecione a máquina..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {printers.length === 0 && !loadingPrinters ? (
                  <SelectItem value="none" disabled>
                    Nenhuma impressora registada
                  </SelectItem>
                ) : (
                  printers.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantidade produzida *</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              placeholder="Ex: 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              O sistema irá descontar automaticamente os materiais necessários
              do inventário.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !productId || !printerId || !quantity}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Processando...
                </>
              ) : (
                "Registar no Stock"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
