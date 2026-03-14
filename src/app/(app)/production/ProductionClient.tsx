"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AddProductionDialog } from "@/components/forms/AddProductionDialog";
import { formatDate } from "@/lib/utils";
import { Product, ProductionLog } from "@prisma/client";

type LogWithProduct = ProductionLog & { product: Product };

export function ProductionClient({
  initialLogs,
  products,
}: {
  initialLogs: LogWithProduct[];
  products: Product[];
}) {
  const [logs, setLogs] = useState<LogWithProduct[]>(initialLogs);

  const refresh = useCallback(() => {
    fetch("/api/production")
      .then((r) => r.json())
      .then(setLogs);
  }, []);

  const totalThisMonth = logs
    .filter((l) => new Date(l.date).getMonth() === new Date().getMonth())
    .reduce((s, l) => s + l.quantity, 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalThisMonth} unidades produzidas este mês
        </p>
        <AddProductionDialog products={products} onAdded={refresh} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Data
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Modelo
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Qtd
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {log.product.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400 font-medium">
                        +{log.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.notes || "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                    >
                      Nenhuma produção registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
