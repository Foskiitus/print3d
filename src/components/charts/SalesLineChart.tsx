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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(215 16% 56%)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(215 16% 56%)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(224 71% 6%)",
            border: "1px solid hsl(216 34% 17%)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(213 31% 91%)" }}
          formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(210 100% 60%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(210 100% 60%)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
