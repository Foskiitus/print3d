"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Monitor, Zap, Euro } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewPrinterDialog } from "@/components/forms/NewPrinterDialog";
import { toast } from "@/components/ui/toaster";

export function PrintersClient({
  initialPrinters,
}: {
  initialPrinters: any[];
}) {
  const [printers, setPrinters] = useState(initialPrinters);

  const refreshPrinters = async () => {
    const res = await fetch("/api/printers");
    setPrinters(await res.json());
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta impressora? Esta ação não pode ser desfeita."))
      return;

    try {
      const res = await fetch(`/api/printers/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast({ title: "Impressora eliminada" });
      refreshPrinters();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Minhas Máquinas
        </h2>
        <NewPrinterDialog onCreated={refreshPrinters} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map((printer) => (
          <Card
            key={printer.id}
            className="relative group hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Monitor className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{printer.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {printer.model || "Modelo não especificado"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                  onClick={() => handleDelete(printer.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-muted">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500" />
                  <span className="text-sm font-medium">
                    {printer.powerWatts}W
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro size={14} className="text-green-600" />
                  <span className="text-sm font-medium">
                    {formatCurrency(printer.hourlyCost)}/h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
