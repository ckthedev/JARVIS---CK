"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ==========================================
// 1. AREA WAVE SPARKLINE (FOR STAT CARDS)
// ==========================================

interface AreaWaveSparklineProps {
  color?: "emerald" | "lime" | "amber" | "cyan" | "red";
  height?: number;
  className?: string;
  dataPoints?: number[];
}

export function AreaWaveSparkline({
  color = "emerald",
  height = 56,
  className,
  dataPoints = [20, 25, 22, 35, 30, 48, 42, 60, 45, 38, 52, 65, 40, 34],
}: AreaWaveSparklineProps) {
  const width = 300;
  const h = height;

  // Convert points to SVG cubic bezier curve
  const max = Math.max(...dataPoints, 100);
  const min = Math.min(...dataPoints, 0);

  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = h - ((val - min) / (max - min || 1)) * (h - 10) - 5;
    return { x, y };
  });

  // Construct smooth bezier curve path
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
      gradientStart: "rgba(0, 229, 153, 0.45)",
      gradientEnd: "rgba(0, 229, 153, 0.0)",
    },
    lime: {
      stroke: "#84CC16",
      gradientStart: "rgba(132, 204, 22, 0.45)",
      gradientEnd: "rgba(132, 204, 22, 0.0)",
    },
    amber: {
      stroke: "#F59E0B",
      gradientStart: "rgba(245, 158, 11, 0.45)",
      gradientEnd: "rgba(245, 158, 11, 0.0)",
    },
    cyan: {
      stroke: "#00D4FF",
      gradientStart: "rgba(0, 212, 255, 0.45)",
      gradientEnd: "rgba(0, 212, 255, 0.0)",
    },
    red: {
      stroke: "#EF4444",
      gradientStart: "rgba(239, 68, 68, 0.45)",
      gradientEnd: "rgba(239, 68, 68, 0.0)",
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;
  const gradientId = `wave-grad-${color}-${Math.random().toString(36).substring(2, 7)}`;

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
// 2. LARGE SYSTEM WORKLOAD WAVE CHART
// ==========================================

export function SystemWorkloadWaveChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const timeLabels = ["12:45", "13:45", "14:45", "15:45", "16:45", "17:45", "18:45"];
  // Raw wave points representing multi-hour CPU & load telemetry
  const dataPoints = [24, 28, 22, 32, 29, 36, 48, 58.8, 52, 41, 35, 34.8];

  const width = 800;
  const height = 210;
  const thresholdY = height * 0.22; // 80% mark

  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = height - (val / 100) * (height - 30) - 15;
    return { x, y, val };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[7]; // Peak point default

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm relative hud-brackets">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
              Carga do sistema
            </h3>
            <span className="text-secondary-text text-xs">&mdash;</span>
            <span className="text-xs text-secondary-text font-mono">
              CPU por modo e load average
            </span>
          </div>
        </div>

        {/* Time Filter Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-secondary-text cursor-pointer hover:text-foreground">
            últimas 6h
          </span>
          <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-secondary-text cursor-pointer hover:text-foreground">
            5 min de coleta
          </span>
        </div>
      </div>

      {/* Sub-Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-secondary-text tracking-wider">
              LOAD 1M
            </span>
            <span className="text-[10px] text-secondary-text">/ 8 vCPU</span>
          </div>
          <div className="text-lg font-bold text-foreground">1,8</div>
          <div className="text-[10px] text-secondary-text">0,2 por núcleo</div>
        </div>

        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-secondary-text tracking-wider">
              LOAD 5M
            </span>
            <span className="text-[10px] text-secondary-text">/ 8 vCPU</span>
          </div>
          <div className="text-lg font-bold text-foreground">0,6</div>
          <div className="text-[10px] text-primary">estável</div>
        </div>

        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-secondary-text tracking-wider">
              LOAD 15M
            </span>
            <span className="text-[10px] text-secondary-text">/ 8 vCPU</span>
          </div>
          <div className="text-lg font-bold text-foreground">0,7</div>
          <div className="text-[10px] text-secondary-text">média contínua</div>
        </div>

        <div className="p-2.5 rounded bg-muted/30 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-secondary-text tracking-wider">
              PICO DE CPU
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">às 16:30</span>
          </div>
          <div className="text-lg font-bold text-amber-400">58,8%</div>
          <div className="text-[10px] text-secondary-text">abaixo do limite</div>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full h-[200px] overflow-hidden select-none">
        {/* Threshold Line at 80% */}
        <div
          className="absolute left-0 right-0 border-b border-dashed border-amber-500/60 z-10 flex justify-end pr-2"
          style={{ top: `${thresholdY}px` }}
        >
          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest bg-card px-1 -translate-y-2 border border-amber-500/30 rounded">
            ATENÇÃO 80%
          </span>
        </div>

        {/* Hover inspector instruction */}
        <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-secondary-text/80 bg-background/50 px-2 py-0.5 rounded border border-border/30 backdrop-blur-sm">
          PASSE O MOUSE PARA DETALHAR
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="main-workload-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.45)" />
              <stop offset="40%" stopColor="rgba(0, 229, 153, 0.35)" />
              <stop offset="100%" stopColor="rgba(0, 229, 153, 0.0)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#1A2333" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#1A2333" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#1A2333" strokeDasharray="3 3" />

          {/* Wave Area Fill */}
          <path d={fillD} fill="url(#main-workload-grad)" />

          {/* Wave Glowing Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#00E599"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Vertical Bar & Dot */}
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
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Hover trigger invisible zones */}
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

        {/* Floating Tooltip when Hovered */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-20 -translate-x-1/2 rounded bg-card/95 border border-primary/40 px-2 py-1 text-xs font-mono shadow-lg backdrop-blur-md"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${Math.max(10, activePoint.y - 35)}px`,
            }}
          >
            <span className="font-bold text-primary">{activePoint.val.toFixed(1)}%</span>
            <span className="text-[10px] text-secondary-text ml-1.5">CPU</span>
          </div>
        )}
      </div>

      {/* X-Axis Timestamps */}
      <div className="flex justify-between items-center text-[10px] font-mono text-secondary-text border-t border-border/40 pt-2 mt-1">
        {timeLabels.map((time, idx) => (
          <span key={idx}>{time}</span>
        ))}
      </div>

      {/* Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-3 mt-2 border-t border-border/40">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-secondary-text">user</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-secondary-text">system</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-secondary-text">iowait</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-secondary-text">steal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="text-secondary-text">total</span>
          </div>
        </div>

        <div className="text-[11px] text-secondary-text">
          média do período <span className="font-semibold text-foreground">34,8%</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. RADIAL DONUT GAUGE (MEMORY COMPOSITION)
// ==========================================

export function MemoryDonutGauge() {
  const percentage = 66.5;
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
            Memória
          </h3>
          <span className="text-secondary-text text-xs">&mdash;</span>
          <span className="text-xs text-secondary-text font-mono">composição</span>
        </div>
        <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-secondary-text">
          agora
        </span>
      </div>

      {/* Donut Chart & Legend Side-by-Side */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
        {/* SVG Donut Circle */}
        <div className="relative flex items-center justify-center">
          <svg width="150" height="150" className="rotate-[-90deg]">
            {/* Background Track */}
            <circle
              cx="75"
              cy="75"
              r={radius}
              stroke="#1A2333"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Value Arc with Neon Glow */}
            <circle
              cx="75"
              cy="75"
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
              {percentage}%
            </span>
            <span className="text-[10px] text-secondary-text">
              10,6 GB / 16,0 GB
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2.5 font-mono text-xs w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-secondary-text text-[11px]">Em uso</span>
            </div>
            <span className="font-semibold text-foreground text-[11px]">
              10,6 GB <span className="text-secondary-text font-normal">66,5%</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span className="text-secondary-text text-[11px]">Disponível</span>
            </div>
            <span className="font-semibold text-foreground text-[11px]">
              5,4 GB <span className="text-secondary-text font-normal">33,5%</span>
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-emerald-400">
              sem pressão de memória
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Swap Bar */}
      <div className="pt-3 border-t border-border/40 mt-4 font-mono text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-[11px] text-secondary-text">Swap em uso</span>
            <span className="text-[10px] text-secondary-text/80">2,0 GB total</span>
          </div>
          <span className="font-bold text-foreground text-[11px]">12%</span>
        </div>

        {/* Swap Progress Bar */}
        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: "12%" }}
          />
          {/* Threshold mark 80% */}
          <div className="absolute top-0 bottom-0 right-[20%] w-0.5 bg-border" />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[9px] text-secondary-text">limiar 80%</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. FILESYSTEMS OCCUPATION TABLE
// ==========================================

export function FilesystemUsageTable() {
  const mounts = [
    {
      mount: "/var",
      total: "100,0 GB",
      used: "81,2 GB",
      free: "18,8 GB",
      occupancy: 81,
      delta: "+ 1,5",
      inodes: "12%",
      color: "bg-amber-500",
    },
    {
      mount: "/",
      total: "64,0 GB",
      used: "36,1 GB",
      free: "27,9 GB",
      occupancy: 57,
      delta: "= 0,5",
      inodes: "88%",
      color: "bg-yellow-400",
    },
    {
      mount: "/home",
      total: "252,0 GB",
      used: "98,5 GB",
      free: "153,5 GB",
      occupancy: 39,
      delta: "+ 0,1",
      inodes: "97%",
      color: "bg-emerald-400",
    },
    {
      mount: "/opt/data",
      total: "500,0 GB",
      used: "121,5 GB",
      free: "378,5 GB",
      occupancy: 24,
      delta: "+ 0,2",
      inodes: "99%",
      color: "bg-emerald-400",
    },
    {
      mount: "/boot",
      total: "1,0 GB",
      used: "190,5 MB",
      free: "833,5 MB",
      occupancy: 19,
      delta: "+ 0,1",
      inodes: "99%",
      color: "bg-emerald-400",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm relative hud-brackets">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
            Filesystems
          </h3>
          <span className="text-secondary-text text-xs">&mdash;</span>
          <span className="text-xs text-secondary-text font-mono">
            ordenado por ocupação
          </span>
        </div>
        <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-secondary-text">
          5 montagens
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border/40 text-[9px] uppercase tracking-wider text-secondary-text">
              <th className="pb-2 font-medium">Ponto de Montagem</th>
              <th className="pb-2 font-medium">Usado</th>
              <th className="pb-2 font-medium">Livre</th>
              <th className="pb-2 font-medium">Ocupação</th>
              <th className="pb-2 font-medium text-center">&Delta;</th>
              <th className="pb-2 font-medium text-right">Inodes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {mounts.map((row) => (
              <tr key={row.mount} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5">
                  <div className="font-bold text-foreground">{row.mount}</div>
                  <div className="text-[10px] text-secondary-text">
                    total {row.total}
                  </div>
                </td>
                <td className="py-2.5 text-foreground">{row.used}</td>
                <td className="py-2.5 text-secondary-text">{row.free}</td>
                <td className="py-2.5 w-32">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", row.color)}
                        style={{ width: `${row.occupancy}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground w-7 text-right">
                      {row.occupancy}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-center text-[10px] text-secondary-text">
                  {row.delta}
                </td>
                <td className="py-2.5 text-right text-secondary-text">
                  {row.inodes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alert Notice at Bottom */}
      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center gap-2 font-mono text-[11px]">
        <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
        <span className="text-secondary-text">
          <strong className="text-amber-400 font-semibold">/var</strong> sobe 6,2 p.p./dia &mdash; chega a 90% em 1 dia
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 5. DISK LATENCY & NETWORK INTERFACES
// ==========================================

export function HardwareLatencyAndNetwork() {
  const disks = [
    { name: "sdb", r: 14.8, w: 23.1, warning: true },
    { name: "sda", r: 4.4, w: 6.2, warning: false },
    { name: "dm-0", r: 2.8, w: 3.9, warning: false },
  ];

  const interfaces = [
    { name: "eth0", status: "DOWN", inBps: "0 bps", outBps: "0 bps", up: false },
    { name: "eth1", status: "UP", inBps: "24,9 Mbps", outBps: "14,0 Mbps", up: true },
    { name: "eth2", status: "UP", inBps: "6,6 Mbps", outBps: "4,9 Mbps", up: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Disk Latency Card */}
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets">
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
              Disco
            </h3>
            <span className="text-secondary-text text-xs">&mdash;</span>
            <span className="text-xs text-secondary-text font-mono">latência</span>
          </div>
          <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-secondary-text">
            3 devices
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {disks.map((d) => (
            <div key={d.name} className="flex items-center justify-between gap-3">
              <div className="w-12">
                <span className="font-bold text-foreground">{d.name}</span>
                <span className="block text-[9px] text-secondary-text">pior 23,1 ms</span>
              </div>

              {/* Progress bars for Read/Write latency */}
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.warning ? "bg-amber-400" : "bg-emerald-400"
                    )}
                    style={{ width: `${Math.min(100, (d.r / 30) * 100)}%` }}
                  />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.warning ? "bg-amber-500" : "bg-cyan-400"
                    )}
                    style={{ width: `${Math.min(100, (d.w / 30) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-right w-16">
                <div className="text-[11px] text-secondary-text">{d.r} ms</div>
                <div
                  className={cn(
                    "text-[11px] font-bold",
                    d.warning ? "text-amber-400" : "text-foreground"
                  )}
                >
                  {d.w} ms
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-secondary-text flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span>sdb acima do limiar de 20 ms</span>
        </div>
      </div>

      {/* Network Interfaces Card */}
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets">
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
              Interfaces
            </h3>
            <span className="text-secondary-text text-xs">&mdash;</span>
            <span className="text-xs text-secondary-text font-mono">tráfego</span>
          </div>
          <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-secondary-text">
            1-3 de 9
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {interfaces.map((iface) => (
            <div
              key={iface.name}
              className="flex items-center justify-between gap-3 p-2 rounded bg-muted/30 border border-border/40"
            >
              <div>
                <span className="font-bold text-foreground">{iface.name}</span>
                <span className="block text-[9px] text-secondary-text">
                  {iface.up ? "pico 29,2 Mbps" : "pico 0 bps"}
                </span>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-foreground">{iface.inBps}</div>
                <div className="text-[10px] text-secondary-text">{iface.outBps}</div>
              </div>

              {/* Status Badge */}
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider border",
                  iface.up
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40"
                )}
              >
                {iface.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. ACTIVE PROBLEMS / ALERTS PANEL
// ==========================================

export function ActiveProblemsPanel() {
  const problems = [
    {
      severity: "ALTA",
      color: "bg-red-500/20 text-red-400 border-red-500/40",
      title: "Interface eth0: Link down",
      ack: "Não",
      start: "26/08 15:28",
      age: "3h 32m",
    },
    {
      severity: "MÉDIA",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      title: "/var: Disk space is low (used > 80%)",
      ack: "Sim",
      start: "26/08 13:55",
      age: "5h 05m",
    },
    {
      severity: "MÉDIA",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      title: "sdb: Disk write request responses are too high (avg > 20ms)",
      ack: "Não",
      start: "26/08 18:07",
      age: "53m",
    },
    {
      severity: "ATENÇÃO",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
      title: "Zabbix agent: there are unsupported items on the host",
      ack: "Não",
      start: "26/08 02:18",
      age: "16h 42m",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm relative hud-brackets">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-bold tracking-wider text-foreground">
            Problemas ativos
          </h3>
          <span className="text-secondary-text text-xs">&mdash;</span>
          <span className="text-xs text-secondary-text font-mono">
            severidade mínima Warning
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-secondary-text">
          <span className="rounded bg-muted/80 border border-border/60 px-2 py-0.5">
            3 não reconhecidos
          </span>
          <span>atualizado há 1243 s</span>
        </div>
      </div>

      {/* Summary Counters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4 font-mono text-xs">
        <div className="flex items-center gap-3 pr-4 lg:border-r border-border/40">
          <span className="text-3xl font-extrabold text-foreground">4</span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              PROBLEMAS
            </div>
            <div className="text-[10px] text-secondary-text">EM ABERTO</div>
          </div>
        </div>

        {/* Severity Count Meters */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-[11px]">Desastre</span>
            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-red-600 w-0" />
            </div>
            <span className="font-bold text-foreground">0</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-[11px]">Alta</span>
            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-red-500 w-[25%]" />
            </div>
            <span className="font-bold text-red-400">1</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-[11px]">Média</span>
            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-amber-500 w-[50%]" />
            </div>
            <span className="font-bold text-amber-400">2</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-[11px]">Atenção</span>
            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-yellow-400 w-[25%]" />
            </div>
            <span className="font-bold text-yellow-400">1</span>
          </div>

          <div className="text-[10px] text-secondary-text ml-auto">
            &bull; mais antigo há 16h 42m
          </div>
        </div>
      </div>

      {/* Alert List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border/40 text-[9px] uppercase tracking-wider text-secondary-text">
              <th className="pb-2 font-medium w-24">Severidade</th>
              <th className="pb-2 font-medium">Problema</th>
              <th className="pb-2 font-medium text-center">ACK</th>
              <th className="pb-2 font-medium">Início</th>
              <th className="pb-2 font-medium text-right">Idade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {problems.map((p, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                      p.color
                    )}
                  >
                    {p.severity}
                  </span>
                </td>
                <td className="py-2.5 font-medium text-foreground">{p.title}</td>
                <td className="py-2.5 text-center text-secondary-text">{p.ack}</td>
                <td className="py-2.5 text-secondary-text">{p.start}</td>
                <td className="py-2.5 text-right font-semibold text-foreground">
                  {p.age}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
