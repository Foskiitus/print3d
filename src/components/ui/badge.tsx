import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        // ✅ text-destructive em vez de text-red-400
        destructive: "bg-destructive/15 text-destructive",
        outline: "border border-border text-foreground",
        // ✅ bg-success/15 text-success em vez de bg-emerald-500/20 text-emerald-400
        success: "bg-success/15 text-success",
        // ✅ bg-warning/15 text-warning em vez de bg-amber-500/20 text-amber-400
        warning: "bg-warning/15 text-warning",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
