"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarViewType = "month" | "week" | "day" | "agenda";

interface CalendarHeaderProps {
  title: string;
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function CalendarHeader({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  children,
  className,
}: CalendarHeaderProps) {
  const views: { id: CalendarViewType; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
    { id: "agenda", label: "Agenda" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#303030] bg-[#202020]",
        className
      )}
    >
      {/* Left: Nav & Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center rounded-lg border border-[#303030] bg-[#181818] p-0.5">
          <button
            onClick={onPrev}
            className="h-7 w-7 flex items-center justify-center rounded text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#262626] transition-colors"
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="px-2.5 h-7 text-xs font-semibold text-[#F5F5F5] hover:bg-[#262626] rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={onNext}
            className="h-7 w-7 flex items-center justify-center rounded text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#262626] transition-colors"
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[#F5F5F5] tracking-tight">
          {title}
        </h2>
      </div>

      {/* Right: View Switcher & Children Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-[#303030] bg-[#181818] p-0.5">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                view === v.id
                  ? "bg-[#262626] text-[#F5F5F5] font-semibold border border-[#383838]"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
