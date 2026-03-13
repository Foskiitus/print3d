import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export function KpiCard({ title, value, sub, icon: Icon, trend }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            {sub && (
              <p className={cn('text-xs mt-1.5', {
                'text-emerald-400': trend === 'up',
                'text-red-400': trend === 'down',
                'text-muted-foreground': trend === 'neutral' || !trend,
              })}>
                {sub}
              </p>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
