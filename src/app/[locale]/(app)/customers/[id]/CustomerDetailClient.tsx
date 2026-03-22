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
import { cn } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";

function formatDate(date: string | Date, locale: string) {
  return new Date(date).toLocaleDateString(
    locale === "en" ? "en-GB" : "pt-PT",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function CustomerDetailClient({
  customer,
  sales,
  stats,
  topProducts,
  locale,
}: {
  customer: any;
  sales: any[];
  stats: { totalSpent: number; totalUnits: number; totalProfit: number };
  topProducts: { name: string; quantity: number; revenue: number }[];
  locale: string;
}) {
  const c = useIntlayer("customers");

  const summaryItems = [
    {
      label: c.detail.totalSpent.value,
      value: formatCurrency(stats.totalSpent),
      icon: TrendingUp,
      color: "bg-success/10 text-success",
    },
    {
      label: c.detail.unitsBought.value,
      value: stats.totalUnits.toString(),
      icon: ShoppingBag,
      color: "bg-info/10 text-info",
    },
    {
      label: c.detail.profitGenerated.value,
      value: formatCurrency(stats.totalProfit),
      icon: TrendingUp,
      color: "bg-primary/10 text-primary",
    },
  ];

  const tableHeaders = [
    c.detail.tableHeaders.date.value,
    c.detail.tableHeaders.product.value,
    c.detail.tableHeaders.qty.value,
    c.detail.tableHeaders.pricePerUnit.value,
    c.detail.tableHeaders.total.value,
    c.detail.tableHeaders.profit.value,
  ];

  return (
    <div className="space-y-6">
      {/* ── Info + métricas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {c.detail.info}
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
                  {c.detail.noInfo}
                </p>
              )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
              {c.detail.summary}
            </p>
            <div className="grid grid-cols-3 gap-4">
              {summaryItems.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="space-y-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      color,
                    )}
                  >
                    <Icon size={15} />
                  </div>
                  <p className="text-xl font-display font-bold text-foreground leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos mais comprados */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={13} className="text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {c.detail.topProducts}
              </p>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {c.detail.noPurchases}
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/50 w-4 flex-shrink-0 font-display font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-foreground">
                        {p.name}
                      </p>
                      <div className="w-full bg-muted/40 rounded-full h-1 mt-1.5">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(p.quantity / (topProducts[0]?.quantity || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium tabular-nums">
                        {p.quantity} {c.detail.units.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {formatCurrency(p.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de compras */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ShoppingBag size={13} className="text-muted-foreground" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {c.detail.purchaseHistory}
            </p>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {sales.length} {c.salesSuffix.value}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {tableHeaders.map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest",
                        i >= 2 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const total = sale.salePrice * sale.quantity;
                  const costPerUnit = sale.costPerUnit ?? 0;
                  const profit = (sale.salePrice - costPerUnit) * sale.quantity;
                  const hasRealCost = sale.costPerUnit != null;

                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(sale.date, locale)}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {sale.product.name}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">
                        {sale.quantity}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatCurrency(sale.salePrice)}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {hasRealCost ? (
                          <span
                            className={cn(
                              "font-medium",
                              profit >= 0 ? "text-success" : "text-destructive",
                            )}
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
                      {c.detail.noPurchasesRegistered}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
