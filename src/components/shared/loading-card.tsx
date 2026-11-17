import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LoadingCard({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader className="space-y-2">
        <div className="h-4 w-1/3 rounded bg-sidebar-accent/80" />
        <div className="h-3 w-1/2 rounded bg-sidebar-accent/50" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-8 w-full rounded bg-sidebar-accent/40" />
        <div className="h-8 w-full rounded bg-sidebar-accent/40" />
        <div className="h-8 w-full rounded bg-sidebar-accent/40" />
      </CardContent>
    </Card>
  );
}
