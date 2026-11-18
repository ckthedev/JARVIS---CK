"use client";

import React, { useEffect, useState } from "react";
import { Server, Zap } from "lucide-react";

export function CockpitTelemetryBar() {
  const [timeStr, setTimeStr] = useState<string>("19:31:30");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-2 mb-6">
      {/* Top Cockpit Title & Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs">
        {/* Brand / NOC Breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono font-bold tracking-wider text-foreground text-sm uppercase">
            <span className="inline-flex h-3 w-3 items-center justify-center rounded bg-primary/20 text-primary">
              <Zap className="h-2.5 w-2.5 fill-primary" />
            </span>
            <span>JARVIS SYSTEM</span>
          </div>
          <span className="text-secondary-text font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
            COCKPIT NOC
          </span>
          <span className="hidden sm:inline-block text-secondary-text font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
            AI AGENT
          </span>
        </div>

        {/* Live Indicator & Clock */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-primary">
              AO VIVO
            </span>
          </div>

          <div className="text-sm font-semibold tracking-widest text-foreground font-mono bg-card px-2.5 py-0.5 rounded border border-border">
            {mounted ? timeStr : "--:--:--"}
          </div>

          <span className="hidden md:inline-block text-[11px] text-secondary-text">
            atualiza a cada 5s
          </span>
        </div>
      </div>

      {/* Sub Telemetry Bar (Server Specs & Real-Time Counters) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/95 px-4 py-2.5 shadow-sm">
        {/* Left: Server Chip & OS */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted border border-border/80 text-primary">
            <Server className="h-4 w-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold text-foreground tracking-wide">
                srv-jarvis-core
              </span>
              <span className="rounded bg-primary/20 border border-primary/40 px-1.5 py-0.2 text-[10px] font-semibold text-primary font-mono tracking-wider">
                AGENTE ATIVO
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-secondary-text font-mono">
              Ubuntu 24.04 LTS &bull; kernel 6.8.0-45 x86_64 &bull; coletado agora
            </span>
          </div>
        </div>

        {/* Right: Telemetry Grid Metrics */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-xs">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-secondary-text">
              UPTIME
            </span>
            <span className="font-semibold text-foreground">42d 06h</span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-secondary-text">
              VCPU
            </span>
            <span className="font-semibold text-foreground">8 núcleos</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-secondary-text">
              PROCESSOS
            </span>
            <span className="font-semibold text-foreground">214</span>
          </div>

          <div className="hidden md:flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-secondary-text">
              SESSÕES
            </span>
            <span className="font-semibold text-foreground">1 usuário</span>
          </div>

          <div className="hidden lg:flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-secondary-text">
              PACOTES
            </span>
            <span className="font-semibold text-foreground">1.247/s</span>
          </div>

          <div className="hidden xl:flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-secondary-text">
              CLOCK SKEW
            </span>
            <span className="font-semibold text-primary font-mono">+0,2 s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
