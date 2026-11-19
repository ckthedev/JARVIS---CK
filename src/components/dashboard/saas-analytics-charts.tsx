"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  DayProductivity,
  TaskStatusBreakdown,
  PriorityBreakdown,
} from "@/modules/analytics/service";

// 1. Weekly Productivity Area Chart
export function WeeklyProductivityChart({
  data,
}: {
  data: DayProductivity[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5546F5" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#5546F5" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            stroke="var(--secondary-text)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="var(--secondary-text)"
            fontSize={11}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-border bg-card p-3 shadow-dropdown text-xs">
                    <p className="font-semibold text-primary-text mb-1.5">{label}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-secondary-text">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Completed
                        </span>
                        <span className="font-bold text-primary-text">
                          {payload[0]?.value}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-secondary-text">
                          <span className="h-2 w-2 rounded-full bg-secondary" />
                          Created
                        </span>
                        <span className="font-bold text-primary-text">
                          {payload[1]?.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#5546F5"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCompleted)"
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="#8B5CF6"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorCreated)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Task Status Donut Chart
export function TaskStatusDonutChart({
  data,
  totalTasks,
  completionRate,
}: {
  data: TaskStatusBreakdown[];
  totalTasks: number;
  completionRate: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Donut Chart with Center Percentage */}
      <div className="relative h-48 w-48 shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="rounded-xl border border-border bg-card p-2 shadow-dropdown text-xs font-medium text-primary-text">
                      {item.name}: <span className="font-bold">{item.value}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-bold tracking-tight text-primary-text">
            {completionRate}%
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-secondary-text">
            Completed
          </span>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="w-full space-y-2 text-xs">
        {data.map((item) => {
          const pct = totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0;
          return (
            <div
              key={item.name}
              className="flex items-center justify-between p-2 rounded-xl border border-border/70 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-md"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-primary-text">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary-text">{item.value}</span>
                <span className="text-[10px] text-secondary-text">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. Daily Activity Bar Chart
export function DailyActivityBarChart({
  data,
}: {
  data: DayProductivity[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="day"
            stroke="var(--secondary-text)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="var(--secondary-text)"
            fontSize={11}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-border bg-card p-3 shadow-dropdown text-xs">
                    <p className="font-semibold text-primary-text mb-1">{label}</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-secondary-text">Tasks Executed:</span>
                      <span className="font-bold text-primary">
                        {payload[0]?.value}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="completed"
            name="Tasks Executed"
            fill="#5546F5"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Priority Distribution Meters
export function PriorityDistributionMeters({
  data,
  totalTasks,
}: {
  data: PriorityBreakdown[];
  totalTasks: number;
}) {
  return (
    <div className="space-y-3.5">
      {data.map((item) => {
        const pct = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
        return (
          <div key={item.priority} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-primary-text">{item.priority}</span>
              <div className="flex items-center gap-1.5 font-semibold text-secondary-text">
                <span className="text-primary-text">{item.count} tasks</span>
                <span>({pct}%)</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
