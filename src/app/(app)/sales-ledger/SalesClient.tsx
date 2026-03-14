"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NewSaleDialog } from "@/components/forms/NewSaleDialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpDown, Search } from "lucide-react";
import { Product, Sale } from "@prisma/client";

type SaleWithProduct = Sale & { product: Product };
type SortKey = "date" | "salePrice" | "customerName" | "product";
type SortDir = "asc" | "desc";

export function SalesClient({
  initialSales,
}: {
  initialSales: SaleWithProduct[];
}) {
  const [sales, setSales] = useState<SaleWithProduct[]>(initialSales);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const refresh = useCallback(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then(setSales);
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sales
      .filter(
        (s) =>
          !q ||
          // Adicionamos (s.customerName || "") para garantir que nunca é null
          (s.customerName || "").toLowerCase().includes(q) ||
          s.product.name.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date")
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sortKey === "salePrice")
          cmp = a.salePrice * a.quantity - b.salePrice * b.quantity;
        else if (sortKey === "customerName")
          // Fazemos o mesmo aqui para comparar em segurança
          cmp = (a.customerName || "").localeCompare(b.customerName || "");
        else if (sortKey === "product")
          cmp = a.product.name.localeCompare(b.product.name);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [sales, search, sortKey, sortDir]);

  const totalRevenue = filtered.reduce(
    (s, x) => s + x.salePrice * x.quantity,
    0,
  );
  const totalProfit = filtered.reduce(
    (s, x) => s + (x.salePrice - (x.product.margin || 0)) * x.quantity,
    0,
  );

  function SortButton({ col }: { col: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <ArrowUpDown
          size={11}
          className={sortKey === col ? "text-primary" : ""}
        />
      </button>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por cliente ou produto..."
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NewSaleDialog onCreated={refresh} />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Transações", value: String(filtered.length) },
          { label: "Receita total", value: formatCurrency(totalRevenue) },
          { label: "Lucro estimado", value: formatCurrency(totalProfit) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg px-4 py-3"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Data <SortButton col="date" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Produto <SortButton col="product" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Cliente <SortButton col="customerName" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Qtd
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex items-center gap-1 justify-end">
                      Total <SortButton col="salePrice" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Lucro
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => {
                  const total = sale.salePrice * sale.quantity;
                  const profit =
                    (sale.salePrice - sale.product.margin) * sale.quantity;
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {sale.product.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sale.customerName}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {sale.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            profit >= 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {formatCurrency(profit)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                    >
                      {search
                        ? "Nenhuma venda encontrada para essa busca."
                        : "Nenhuma venda registrada ainda."}
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
