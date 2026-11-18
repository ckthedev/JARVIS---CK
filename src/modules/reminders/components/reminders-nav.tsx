"use client";

import React from "react";
import {
  Bell,
  Sun,
  Calendar,
  AlertTriangle,
  Repeat,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReminderSection, ReminderStats } from "../types";
import { Button } from "@/components/ui/button";

interface RemindersNavProps {
  currentSection: ReminderSection;
  onSelectSection: (section: ReminderSection) => void;
  onOpenCreate: () => void;
  stats?: ReminderStats;
}

export function RemindersNav({
  currentSection,
  onSelectSection,
  onOpenCreate,
  stats,
}: RemindersNavProps) {
  const navItems = [
    {
      id: "all" as ReminderSection,
      label: "All Reminders",
      icon: Bell,
      count: stats?.total ?? 0,
      badgeColor: "bg-primary/20 text-primary",
    },
    {
      id: "today" as ReminderSection,
      label: "Today",
      icon: Sun,
      count: stats?.today ?? 0,
      badgeColor: "bg-amber-400/20 text-amber-400",
    },
    {
      id: "upcoming" as ReminderSection,
      label: "Upcoming",
      icon: Calendar,
      count: stats?.upcoming ?? 0,
      badgeColor: "bg-cyan-400/20 text-cyan-400",
    },
    {
      id: "overdue" as ReminderSection,
      label: "Overdue",
      icon: AlertTriangle,
      count: stats?.overdue ?? 0,
      badgeColor: "bg-red-400/20 text-red-400",
    },
    {
      id: "recurring" as ReminderSection,
      label: "Recurring",
      icon: Repeat,
      count: stats?.recurring ?? 0,
      badgeColor: "bg-purple-400/20 text-purple-400",
    },
    {
      id: "completed" as ReminderSection,
      label: "Completed",
      icon: CheckCircle2,
      count: stats?.completed ?? 0,
      badgeColor: "bg-emerald-400/20 text-emerald-400",
    },
    {
      id: "cancelled" as ReminderSection,
      label: "Cancelled",
      icon: XCircle,
      count: stats?.cancelled ?? 0,
      badgeColor: "bg-gray-400/20 text-gray-400",
    },
  ];

  return (
    <div className="w-full lg:w-64 space-y-4 shrink-0">
      <Button
        onClick={onOpenCreate}
        className="w-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
      >
        <Plus className="h-4 w-4" />
        Add Reminder
      </Button>

      <div className="rounded-xl border border-border/80 bg-card p-2 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">
          Views & Filters
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-secondary-text hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-secondary-text"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    item.badgeColor
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
