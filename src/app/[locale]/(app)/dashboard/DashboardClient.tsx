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
import {
  TrendingUp,
  TrendingDown,
  Package,
  Droplets,
  Euro,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useIntlayer } from "next-intlayer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

const axisTickStyle = {
  fontSize: 10,
  fill: "hsl(var(--muted-foreground))",
};

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconClass: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {label}
          </p>
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              iconClass,
            )}
          >
            <Icon size={15} />
          </div>
        </div>
        <p className="text-2xl font-display font-bold text-foreground leading-none">
          {value}
        </p>
        <p
          className={cn(
            "text-xs mt-2 flex items-center gap-1",
            trend === "up"
              ? "text-success"
              : trend === "down"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {trend === "up" && <TrendingUp size={11} />}
          {trend === "down" && <TrendingDown size={11} />}
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
      {children}
    </p>
  );
}

// ─── DashboardClient ──────────────────────────────────────────────────────────
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
  const c = useIntlayer("dashboard");

  const profitMargin =
    metrics.revenue > 0
      ? ((metrics.profit / metrics.revenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* ── Métricas principais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={c.metrics.revenue.value}
          value={formatCurrency(metrics.revenue)}
          sub={`${profitMargin}% ${c.metrics.revenueSub.value}`}
          icon={Euro}
          iconClass="bg-success/10 text-success"
          trend="up"
        />
        <MetricCard
          label={c.metrics.profit.value}
          value={formatCurrency(metrics.profit)}
          sub={c.metrics.profitSub.value}
          icon={TrendingUp}
          iconClass="bg-primary/10 text-primary"
          trend="up"
        />
        <MetricCard
          label={c.metrics.unitsProduced.value}
          value={metrics.unitsProduced.toString()}
          sub={c.metrics.unitsProducedSub.value}
          icon={Package}
          iconClass="bg-info/10 text-info"
          trend="neutral"
        />
        <MetricCard
          label={c.metrics.filamentConsumed.value}
          value={`${metrics.filamentConsumed.toFixed(0)}${c.units.grams.value}`}
          sub={c.metrics.filamentConsumedSub.value}
          icon={Droplets}
          iconClass="bg-warning/10 text-warning"
          trend="neutral"
        />
      </div>

      {/* ── Gráficos de evolução ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <SectionTitle>{c.charts.dailyRevenue}</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.25}
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
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => [
                    formatCurrency(v),
                    c.tooltips.revenue.value,
                  ]}
                  labelFormatter={shortDate}
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "hsl(var(--primary))",
                    strokeWidth: 0,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <SectionTitle>{c.charts.dailyProduction}</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyProduction} barSize={6}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => [v, c.tooltips.units.value]}
                  labelFormatter={shortDate}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
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

      {/* ── Listas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos mais vendidos */}
        <Card>
          <CardContent className="p-5">
            <SectionTitle>{c.lists.topProducts}</SectionTitle>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {c.empty.noSales}
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/50 w-4 font-display font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-foreground">
                        {p.name}
                      </p>
                      <div className="w-full bg-muted/40 rounded-full h-1 mt-1.5">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${(p.quantity / (topProducts[0]?.quantity || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground flex-shrink-0 tabular-nums">
                      {p.quantity} {c.units.units.value}
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
            <SectionTitle>{c.lists.stock}</SectionTitle>
            {stockMap.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {c.empty.noProducts}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {[...stockMap]
                  .sort((a: any, b: any) => a.stock - b.stock)
                  .map((p: any) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between py-1 text-sm border-b border-border/40 last:border-0"
                    >
                      <span className="truncate text-muted-foreground max-w-[160px] text-xs">
                        {p.name}
                      </span>
                      <span
                        className={cn(
                          "font-display font-bold flex-shrink-0 ml-2 text-sm tabular-nums",
                          p.stock <= 0
                            ? "text-destructive"
                            : p.stock <= 3
                              ? "text-warning"
                              : "text-foreground",
                        )}
                      >
                        {p.stock <= 0 ? 0 : p.stock}
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                          {" "}
                          {c.units.units.value}
                        </span>
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
            <SectionTitle>{c.lists.filamentStock}</SectionTitle>
            {filamentStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {c.empty.noSpools}
              </p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {filamentStock.map((f: any) => {
                  const pct = Math.min(100, (f.remaining / f.total) * 100);
                  const isLow = pct < 20;
                  return (
                    <div key={f.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-border/40"
                            style={{ backgroundColor: f.colorHex }}
                          />
                          <span className="text-xs truncate text-foreground">
                            {f.name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs flex-shrink-0 ml-2 font-medium tabular-nums",
                            isLow ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {f.remaining.toFixed(0)}
                          {c.units.grams.value}
                        </span>
                      </div>
                      <div className="w-full bg-muted/40 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isLow
                              ? "hsl(var(--warning))"
                              : f.colorHex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
