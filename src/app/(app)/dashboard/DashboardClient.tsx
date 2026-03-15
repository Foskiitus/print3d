"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Package, Layers, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

function shortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function DashboardClient({
  metrics,
  dailyRevenue,
  dailyProduction,
  topProducts,
  stockMap,
  filamentStock,
}: {
  metrics: {
    revenue: number;
    profit: number;
    unitsProduced: number;
    filamentConsumed: number;
  };
  dailyRevenue: { date: string; value: number }[];
  dailyProduction: { date: string; value: number }[];
  topProducts: { name: string; quantity: number }[];
  stockMap: { name: string; stock: number }[];
  filamentStock: {
    name: string;
    colorHex: string;
    remaining: number;
    total: number;
  }[];
}) {
  const profitMargin =
    metrics.revenue > 0
      ? ((metrics.profit / metrics.revenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* ── Métricas principais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Receita",
            value: formatCurrency(metrics.revenue),
            sub: `${profitMargin}% margem`,
            icon: TrendingUp,
            color: "text-emerald-400",
          },
          {
            label: "Lucro",
            value: formatCurrency(metrics.profit),
            sub: "após custos",
            icon: TrendingUp,
            color: "text-primary",
          },
          {
            label: "Unidades produzidas",
            value: metrics.unitsProduced.toString(),
            sub: "últimos 30 dias",
            icon: Package,
            color: "text-blue-400",
          },
          {
            label: "Filamento consumido",
            value: `${metrics.filamentConsumed.toFixed(0)}g`,
            sub: "em produção",
            icon: Droplets,
            color: "text-orange-400",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                <Icon size={16} className={color} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Gráficos de evolução ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita diária */}
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Receita diária (€)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [formatCurrency(v), "Receita"]}
                  labelFormatter={shortDate}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produção diária */}
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Unidades produzidas por dia
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyProduction}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [v, "Unidades"]}
                  labelFormatter={shortDate}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos mais vendidos */}
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Produtos mais vendidos
            </p>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sem vendas ainda
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">
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
                    <span className="text-xs font-medium flex-shrink-0">
                      {p.quantity} un.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock por produto */}
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Stock atual
            </p>
            {stockMap.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sem produtos
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {[...stockMap]
                  .sort((a: any, b: any) => a.stock - b.stock)
                  .map((p: any) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-muted-foreground max-w-[160px]">
                        {p.name}
                      </span>
                      <span
                        className={`font-medium flex-shrink-0 ml-2 ${
                          p.stock <= 0
                            ? "text-destructive"
                            : p.stock <= 3
                              ? "text-yellow-500"
                              : "text-foreground"
                        }`}
                      >
                        {p.stock} un.
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filamento restante */}
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Filamento em stock
            </p>
            {filamentStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sem bobines
              </p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {filamentStock.map((f: any) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: f.colorHex }}
                        />
                        <span className="text-xs truncate">{f.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {f.remaining.toFixed(0)}g
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (f.remaining / f.total) * 100)}%`,
                          backgroundColor: f.colorHex,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
