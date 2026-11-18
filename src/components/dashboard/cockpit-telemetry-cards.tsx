"use client";

import React from "react";
import { Cpu, Server, HardDrive, Network, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaWaveSparkline } from "./cockpit-charts";

interface CockpitTelemetryCardsProps {
  cpuUsage?: number;
  memoryUsage?: number;
  storageUsage?: number;
  networkSpeed?: string;
}

export function CockpitTelemetryCards({
  cpuUsage = 34.2,
  memoryUsage = 66.5,
  storageUsage = 81.3,
  networkSpeed = "222,5 Mbps",
}: CockpitTelemetryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. CPU CARD */}
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group hover:border-primary/40 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-foreground">
                CPU
              </span>
              <span className="block text-[10px] text-secondary-text font-mono">
                utilização total
              </span>
            </div>
          </div>
          <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
            6h
          </span>
        </div>

        {/* Large Metric & Delta Badge */}
        <div className="flex items-baseline gap-2.5 my-1 font-mono">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {cpuUsage.toFixed(1).replace(".", ",")} <span className="text-lg font-medium text-secondary-text">%</span>
          </span>
          <span className="flex items-center gap-0.5 rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>5,6 p.p.</span>
          </span>
        </div>

        {/* Sub-Metrics */}
        <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
          <span>pico 58,8%</span>
          <span>iowait 2,3%</span>
          <span>steal 0,3%</span>
        </div>

        {/* Glowing Area Wave Chart */}
        <div className="-mx-4 -mb-4 pt-1">
          <AreaWaveSparkline
            color="emerald"
            dataPoints={[18, 22, 25, 30, 24, 38, 42, 58.8, 45, 32, 28, 34.2]}
            height={52}
          />
        </div>
      </div>

      {/* 2. MEMÓRIA CARD */}
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group hover:border-primary/40 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-lime-500/10 border border-lime-500/20 text-lime-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-foreground">
                Memória
              </span>
              <span className="block text-[10px] text-secondary-text font-mono">
                10,6 GB de 16,0 GB
              </span>
            </div>
          </div>
          <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
            6h
          </span>
        </div>

        {/* Large Metric & Delta Badge */}
        <div className="flex items-baseline gap-2.5 my-1 font-mono">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {memoryUsage.toFixed(1).replace(".", ",")} <span className="text-lg font-medium text-secondary-text">%</span>
          </span>
          <span className="flex items-center gap-0.5 rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>5,5 p.p.</span>
          </span>
        </div>

        {/* Sub-Metrics */}
        <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
          <span>disponível 5,4 GB</span>
          <span>swap 12%</span>
        </div>

        {/* Glowing Area Wave Chart */}
        <div className="-mx-4 -mb-4 pt-1">
          <AreaWaveSparkline
            color="lime"
            dataPoints={[50, 52, 55, 60, 58, 62, 64, 68, 63, 65, 67, 66.5]}
            height={52}
          />
        </div>
      </div>

      {/* 3. ARMAZENAMENTO CARD */}
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group hover:border-amber-500/40 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-foreground">
                Armazenamento
              </span>
              <span className="block text-[10px] text-secondary-text font-mono">
                pior filesystem - /var
              </span>
            </div>
          </div>
          <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
            6h
          </span>
        </div>

        {/* Large Metric & Delta Badge */}
        <div className="flex items-baseline gap-2.5 my-1 font-mono">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {storageUsage.toFixed(1).replace(".", ",")} <span className="text-lg font-medium text-secondary-text">%</span>
          </span>
          <span className="flex items-center gap-0.5 rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>1,5 p.p.</span>
          </span>
        </div>

        {/* Sub-Metrics */}
        <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
          <span className="text-amber-400 font-semibold">1 de 5 acima de 80%</span>
          <span>livre 18,8 GB</span>
        </div>

        {/* Glowing Area Wave Chart */}
        <div className="-mx-4 -mb-4 pt-1">
          <AreaWaveSparkline
            color="amber"
            dataPoints={[75, 76, 78, 77, 79, 80, 80.5, 81, 81.2, 81.1, 81.3]}
            height={52}
          />
        </div>
      </div>

      {/* 4. REDE CARD */}
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group hover:border-cyan-500/40 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-foreground">
                Rede
              </span>
              <span className="block text-[10px] text-secondary-text font-mono">
                soma de 9 interfaces
              </span>
            </div>
          </div>
          <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
            6h
          </span>
        </div>

        {/* Large Metric & Delta Badge */}
        <div className="flex items-baseline gap-2.5 my-1 font-mono">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {networkSpeed.split(" ")[0]} <span className="text-sm font-medium text-secondary-text">{networkSpeed.split(" ")[1] || "Mbps"}</span>
          </span>
          <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
            <ArrowDownRight className="h-3 w-3" />
            <span>12,5 Mbps</span>
          </span>
        </div>

        {/* Sub-Metrics */}
        <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
          <span>&uarr; 142,3 Mbps</span>
          <span>&darr; 60,3 Mbps</span>
          <span>erros 0,0/s</span>
        </div>

        {/* Glowing Area Wave Chart */}
        <div className="-mx-4 -mb-4 pt-1">
          <AreaWaveSparkline
            color="cyan"
            dataPoints={[180, 210, 195, 230, 245, 220, 250, 235, 215, 222.5]}
            height={52}
          />
        </div>
      </div>
    </div>
  );
}
