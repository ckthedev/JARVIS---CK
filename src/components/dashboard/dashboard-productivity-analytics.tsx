"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  DayProductivity,
  TaskStatusBreakdown,
} from "@/modules/analytics/service";
import { DashboardTaskStats } from "@/modules/tasks/types";
import { CheckCircle2, TrendingUp } from "lucide-react";

interface DashboardProductivityAnalyticsProps {
  weeklyProductivity: DayProductivity[];
  statusDistribution?: TaskStatusBreakdown[];
  taskStats: DashboardTaskStats;
  completionRate: number;
}

export function DashboardProductivityAnalytics({
  weeklyProductivity,
  taskStats,
  completionRate,
}: DashboardProductivityAnalyticsProps) {
  const totalCompletedThisWeek = weeklyProductivity.reduce(
    (acc, cur) => acc + cur.completed,
    0
  );
  const totalCreatedThisWeek = weeklyProductivity.reduce(
    (acc, cur) => acc + cur.created,
    0
  );

  return (
    <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292929]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-[#F5F5F5]">
              Productivity Analytics
            </h2>
            <span className="rounded bg-[#262626] border border-[#383838] px-2 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
              Past 7 Days
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Throughput comparison of tasks created versus tasks completed
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E5E5E5]" />
            <span className="text-[#A3A3A3]">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#737373]" />
            <span className="text-[#737373]">Created</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={weeklyProductivity}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E5E5E5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E5E5E5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="chartCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#737373" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#737373" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke="#555555"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#292929" }}
            />
            <YAxis
              stroke="#555555"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#292929" }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-[#303030] bg-[#181818] p-2.5 shadow-xl text-xs">
                      <p className="font-semibold text-[#F5F5F5] mb-1.5">{label}</p>
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-4 py-0.5"
                        >
                          <span
                            className="flex items-center gap-1.5"
                            style={{ color: entry.color }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name === "completed" ? "Completed" : "Created"}
                          </span>
                          <span className="font-bold text-[#F5F5F5]">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#E5E5E5"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#chartCompletedGrad)"
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="#737373"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#chartCreatedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution & KPI Pills */}
      <div className="mt-5 pt-4 border-t border-[#292929] grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[#292929] bg-[#181818] p-2.5 text-center">
          <span className="text-[11px] text-[#A3A3A3] block font-medium">Active Tasks</span>
          <span className="text-base font-bold text-[#F5F5F5] mt-0.5 block">
            {taskStats.totalActive}
          </span>
        </div>

        <div className="rounded-lg border border-[#292929] bg-[#181818] p-2.5 text-center">
          <span className="text-[11px] text-[#A3A3A3] block font-medium">Due Today</span>
          <span className="text-base font-bold text-[#F5F5F5] mt-0.5 block">
            {taskStats.today}
          </span>
        </div>

        <div className="rounded-lg border border-[#292929] bg-[#181818] p-2.5 text-center">
          <span className="text-[11px] text-[#A3A3A3] block font-medium">Completed Total</span>
          <span className="text-base font-bold text-[#D4D4D4] mt-0.5 block">
            {taskStats.completed}
          </span>
        </div>

        <div className="rounded-lg border border-[#292929] bg-[#181818] p-2.5 text-center">
          <span className="text-[11px] text-[#737373] block font-medium">Overdue Alerts</span>
          <span className={`text-base font-bold mt-0.5 block ${taskStats.overdue > 0 ? "text-[#EF4444]" : "text-[#737373]"}`}>
            {taskStats.overdue}
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#737373] pt-3 border-t border-[#292929]">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-[#A3A3A3]" />
          <span>
            <strong className="text-[#F5F5F5] font-semibold">
              {totalCompletedThisWeek}
            </strong>{" "}
            tasks resolved this week ({totalCreatedThisWeek} created)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#A3A3A3]" />
          <span>
            <strong className="text-[#F5F5F5] font-semibold">
              {completionRate}%
            </strong>{" "}
            overall execution rate
          </span>
        </div>
      </div>
    </div>
  );
}
