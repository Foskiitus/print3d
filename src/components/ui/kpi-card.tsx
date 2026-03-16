import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2">
              {title}
            </p>
            <p className="text-2xl font-display font-bold text-foreground leading-none">
              {value}
            </p>
            {sub && (
              <p
                className={cn("text-xs mt-1.5", {
                  // ✅ text-success / text-destructive em vez de text-emerald-400 / text-red-400
                  "text-success": trend === "up",
                  "text-destructive": trend === "down",
                  "text-muted-foreground": trend === "neutral" || !trend,
                })}
              >
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
  );
}
