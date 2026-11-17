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
    <Card className={cn("relative overflow-hidden transition-all hover:border-border/80", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary-text">
            {title}
          </p>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {badge && (
            <span
              className={cn(
                "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
                badge.variant === "success" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                badge.variant === "warning" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                badge.variant === "destructive" && "bg-red-500/10 text-red-400 border border-red-500/20",
                badge.variant === "secondary" && "bg-secondary/15 text-[#A78BFA] border border-secondary/25",
                badge.variant === "outline" && "bg-transparent text-secondary-text border border-border",
                (!badge.variant || badge.variant === "default") && "bg-primary/10 text-primary border border-primary/20"
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
