'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { TopProductData } from '@/types'

const COLORS = ['hsl(210 100% 60%)', 'hsl(210 100% 50%)', 'hsl(210 100% 42%)', 'hsl(210 100% 34%)', 'hsl(210 100% 26%)']

export function TopProductsChart({ data }: { data: TopProductData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'hsl(215 16% 56%)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={110}
          tick={{ fontSize: 11, fill: 'hsl(215 16% 56%)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(224 71% 6%)', border: '1px solid hsl(216 34% 17%)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'hsl(213 31% 91%)' }}
          formatter={(v: number) => [v, 'Unidades']}
        />
        <Bar dataKey="totalSold" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
