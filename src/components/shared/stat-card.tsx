import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "destructive" | "secondary" | "outline";
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-cardHover", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
            {title}
          </p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-subtle text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-primary-text">
            {value}
          </div>
          {badge && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                badge.variant === "success" && "bg-success/10 text-success border border-success/20",
                badge.variant === "warning" && "bg-warning/15 text-warning border border-warning/25",
                badge.variant === "destructive" && "bg-danger/10 text-danger border border-danger/20",
                badge.variant === "secondary" && "bg-muted text-secondary-text border border-border",
                badge.variant === "outline" && "bg-card text-secondary-text border border-border",
                (!badge.variant || badge.variant === "default") && "bg-accent-subtle text-primary border border-primary/20"
              )}
            >
              {badge.text}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-secondary-text">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
