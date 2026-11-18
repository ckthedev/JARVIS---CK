"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ==========================================
// 1. REUSABLE AREA WAVE SPARKLINE
// ==========================================

interface AreaWaveSparklineProps {
  color?: "emerald" | "cyan" | "amber" | "purple" | "red";
  height?: number;
  className?: string;
  dataPoints?: number[];
}

export function AreaWaveSparkline({
  color = "emerald",
  height = 52,
  className,
  dataPoints = [15, 22, 28, 24, 35, 42, 38, 55, 48, 62, 58, 65],
}: AreaWaveSparklineProps) {
  const width = 300;
  const h = height;

  const max = Math.max(...dataPoints, 10);
  const min = Math.min(...dataPoints, 0);

  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = h - ((val - min) / (max - min || 1)) * (h - 10) - 5;
    return { x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const fillD = `${pathD} L ${width} ${h} L 0 ${h} Z`;

  const colorMap = {
    emerald: {
      stroke: "#00E599",
      gradientStart: "rgba(0, 229, 153, 0.4)",
      gradientEnd: "rgba(0, 229, 153, 0.0)",
    },
    cyan: {
      stroke: "#00D4FF",
      gradientStart: "rgba(0, 212, 255, 0.4)",
      gradientEnd: "rgba(0, 212, 255, 0.0)",
    },
    amber: {
      stroke: "#F59E0B",
      gradientStart: "rgba(245, 158, 11, 0.4)",
      gradientEnd: "rgba(245, 158, 11, 0.0)",
    },
    purple: {
      stroke: "#A78BFA",
      gradientStart: "rgba(167, 139, 250, 0.4)",
      gradientEnd: "rgba(167, 139, 250, 0.0)",
    },
    red: {
      stroke: "#EF4444",
      gradientStart: "rgba(239, 68, 68, 0.4)",
      gradientEnd: "rgba(239, 68, 68, 0.0)",
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;
  const gradientId = `sparkline-grad-${color}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={scheme.gradientStart} />
            <stop offset="100%" stopColor={scheme.gradientEnd} />
          </linearGradient>
        </defs>
        <path d={fillD} fill={`url(#${gradientId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={scheme.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ==========================================
// 2. PRODUCTIVITY VELOCITY & ACTIVITY WAVE CHART
// ==========================================

interface ProductivityVelocityChartProps {
  totalTasks: number;
  todayTasks: number;
  completedTasks?: number;
}

export function ProductivityVelocityChart({
  totalTasks,
  todayTasks,
  completedTasks = 8,
}: ProductivityVelocityChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const activityData = [45, 60, 52, 78, 85, 68, 74];

  const width = 800;
  const height = 190;
  const thresholdY = height * 0.25; // 80% daily target

  const points = activityData.map((val, idx) => {
    const x = (idx / (activityData.length - 1)) * width;
    const y = height - (val / 100) * (height - 35) - 15;
    return { x, y, val, day: days[idx] };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[4]; // Friday peak default

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm relative hud-brackets">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
              Productivity Velocity & Workflow Cadence
            </h3>
            <span className="text-secondary-text text-xs">&mdash;</span>
            <span className="text-xs text-secondary-text font-mono">
              Daily Output & Completion Rate
            </span>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="rounded bg-primary/10 border border-primary/30 px-2 py-0.5 text-primary font-semibold">
            Daily Target: 80%
          </span>
          <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-secondary-text">
            7-Day Cadence
          </span>
        </div>
      </div>

      {/* Sub-Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="text-[10px] uppercase text-secondary-text tracking-wider">
            Execution Velocity
          </div>
          <div className="text-lg font-bold text-foreground">87.5%</div>
          <div className="text-[10px] text-primary">On Target</div>
        </div>

        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="text-[10px] uppercase text-secondary-text tracking-wider">
            Tasks Due Today
          </div>
          <div className="text-lg font-bold text-amber-400">{todayTasks} Tasks</div>
          <div className="text-[10px] text-secondary-text">My Day Focus</div>
        </div>

        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="text-[10px] uppercase text-secondary-text tracking-wider">
            Completed This Week
          </div>
          <div className="text-lg font-bold text-emerald-400">{completedTasks} Closed</div>
          <div className="text-[10px] text-secondary-text">Verified Done</div>
        </div>

        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="text-[10px] uppercase text-secondary-text tracking-wider">
            Active Backlog
          </div>
          <div className="text-lg font-bold text-cyan-400">{totalTasks} Open</div>
          <div className="text-[10px] text-secondary-text">Tracked by JARVIS</div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[180px] overflow-hidden select-none">
        {/* Daily Target Threshold 80% */}
        <div
          className="absolute left-0 right-0 border-b border-dashed border-amber-500/60 z-10 flex justify-end pr-2"
          style={{ top: `${thresholdY}px` }}
        >
          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest bg-card px-1 -translate-y-2 border border-amber-500/30 rounded">
            TARGET 80%
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="jarvis-workload-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0, 229, 153, 0.45)" />
              <stop offset="60%" stopColor="rgba(0, 212, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(0, 229, 153, 0.0)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#1A2333" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#1A2333" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#1A2333" strokeDasharray="3 3" />

          {/* Wave Area Fill */}
          <path d={fillD} fill="url(#jarvis-workload-grad)" />

          {/* Wave Glowing Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#00E599"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Indicator */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke="#00E599"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="#00E599"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Interactive touch zones */}
          {points.map((pt, idx) => (
            <rect
              key={idx}
              x={pt.x - width / points.length / 2}
              y={0}
              width={width / points.length}
              height={height}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-20 -translate-x-1/2 rounded bg-card/95 border border-primary/40 px-2.5 py-1 text-xs font-mono shadow-lg backdrop-blur-md"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${Math.max(10, activePoint.y - 35)}px`,
            }}
          >
            <span className="font-bold text-primary">{activePoint.val}%</span>
            <span className="text-[10px] text-secondary-text ml-1.5">Output ({activePoint.day})</span>
          </div>
        )}
      </div>

      {/* X-Axis Timestamps */}
      <div className="flex justify-between items-center text-[11px] font-mono text-secondary-text border-t border-border/40 pt-2 mt-1">
        {days.map((day, idx) => (
          <span key={idx} className={idx === 4 ? "text-primary font-bold" : ""}>
            {day}
          </span>
        ))}
      </div>

      {/* Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-3 mt-2 border-t border-border/40">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-secondary-text">Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-secondary-text">Meetings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-secondary-text">Reminders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-secondary-text">Social Posts</span>
          </div>
        </div>

        <div className="text-[11px] text-secondary-text">
          Weekly Performance: <span className="font-semibold text-foreground">Optimal (87.5%)</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. TASK ALLOCATION RADIAL DONUT GAUGE
// ==========================================

interface TaskDistributionDonutGaugeProps {
  totalActive: number;
  today: number;
  inProgress: number;
  upcoming: number;
  overdue: number;
  critical: number;
}

export function TaskDistributionDonutGauge({
  totalActive,
  today,
  inProgress,
  upcoming,
  overdue,
  critical,
}: TaskDistributionDonutGaugeProps) {
  // Completion or Active efficiency percentage
  const total = totalActive > 0 ? totalActive : 1;
  const activePercentage = Math.min(100, Math.round(((total - overdue) / total) * 100));

  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activePercentage / 100) * circumference;

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
            Task Matrix
          </h3>
          <span className="text-secondary-text text-xs">&mdash;</span>
          <span className="text-xs text-secondary-text font-mono">Allocation</span>
        </div>
        <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-secondary-text">
          Real-time
        </span>
      </div>

      {/* Donut Chart & Legend Side-by-Side */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
        {/* SVG Donut Circle */}
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" className="rotate-[-90deg]">
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="#1A2333"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Value Arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="#00E599"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {activePercentage}%
            </span>
            <span className="text-[10px] text-secondary-text">
              {totalActive} Active
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2 font-mono text-xs w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-secondary-text text-[11px]">Due Today</span>
            </div>
            <span className="font-semibold text-foreground text-[11px]">
              {today}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-secondary-text text-[11px]">In Progress</span>
            </div>
            <span className="font-semibold text-foreground text-[11px]">
              {inProgress}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-secondary-text text-[11px]">Upcoming</span>
            </div>
            <span className="font-semibold text-foreground text-[11px]">
              {upcoming}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-secondary-text text-[11px]">Overdue</span>
            </div>
            <span className="font-semibold text-red-400 text-[11px]">
              {overdue}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Priority Bar */}
      <div className="pt-3 border-t border-border/40 mt-4 font-mono text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-secondary-text">Critical Priority Load</span>
          <span className="font-bold text-amber-400 text-[11px]">
            {critical} Critical Tasks
          </span>
        </div>

        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              critical > 0 ? "bg-amber-400" : "bg-emerald-400"
            )}
            style={{ width: `${Math.min(100, critical * 25)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
