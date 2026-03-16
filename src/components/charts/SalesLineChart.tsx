"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SalesChartData } from "@/types";

interface SalesChartProps {
  data: SalesChartData[];
}

export function SalesLineChart({ data }: SalesChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "dd/MM", { locale: ptBR }),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={formatted}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--foreground))",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(v: number) => [`${v.toFixed(2)}€`, "Receita"]}
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
