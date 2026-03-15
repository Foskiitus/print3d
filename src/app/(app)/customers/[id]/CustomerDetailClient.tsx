"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  Hash,
  TrendingUp,
  ShoppingBag,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CustomerDetailClient({
  customer,
  sales,
  stats,
  topProducts,
}: {
  customer: any;
  sales: any[];
  stats: { totalSpent: number; totalUnits: number; totalProfit: number };
  topProducts: { name: string; quantity: number; revenue: number }[];
}) {
  return (
    <div className="space-y-6">
      {/* ── Info do cliente + métricas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Informação
            </p>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail
                  size={13}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone
                  size={13}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.nif && (
              <div className="flex items-center gap-2 text-sm">
                <Hash
                  size={13}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span>NIF {customer.nif}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin
                  size={13}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText
                  size={13}
                  className="text-muted-foreground flex-shrink-0 mt-0.5"
                />
                <span className="text-muted-foreground">{customer.notes}</span>
              </div>
            )}
            {!customer.email &&
              !customer.phone &&
              !customer.nif &&
              !customer.address &&
              !customer.notes && (
                <p className="text-sm text-muted-foreground">
                  Sem informação adicional.
                </p>
              )}
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Resumo
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total gasto",
                  value: formatCurrency(stats.totalSpent),
                  icon: TrendingUp,
                  color: "text-emerald-400",
                },
                {
                  label: "Unidades compradas",
                  value: stats.totalUnits.toString(),
                  icon: ShoppingBag,
                  color: "text-blue-400",
                },
                {
                  label: "Lucro gerado",
                  value: formatCurrency(stats.totalProfit),
                  icon: TrendingUp,
                  color: "text-primary",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={color} />
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos favoritos */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={13} className="text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Produtos mais comprados
              </p>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sem compras
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.name}</p>
                      <div className="w-full bg-muted/30 rounded-full h-1.5 mt-1">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(p.quantity / (topProducts[0]?.quantity || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium">{p.quantity} un.</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(p.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de vendas */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ShoppingBag size={13} className="text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Histórico de compras
              </p>
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {sales.length} venda(s)
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Data
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Produto
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Qtd
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Preço/un
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Lucro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const total = sale.salePrice * sale.quantity;
                    const costPerUnit = sale.costPerUnit ?? 0;
                    const profit =
                      (sale.salePrice - costPerUnit) * sale.quantity;
                    const hasRealCost = sale.costPerUnit != null;

                    return (
                      <tr
                        key={sale.id}
                        className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(sale.date)}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          {sale.product.name}
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground">
                          {sale.quantity}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {formatCurrency(sale.salePrice)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {formatCurrency(total)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {hasRealCost ? (
                            <span
                              className={
                                profit >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }
                            >
                              {formatCurrency(profit)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {sales.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-muted-foreground text-sm"
                      >
                        Nenhuma compra registada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
