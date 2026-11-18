"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JarvisHudHeaderProps {
  userName: string;
  greetingTime: string;
  formattedDate: string;
}

export function JarvisHudHeader({
  userName,
  greetingTime,
  formattedDate,
}: JarvisHudHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("19:45:00");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
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

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
      {/* Top Telemetry & Clock Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        {/* Status Chip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-primary">
              JARVIS CORE ONLINE
            </span>
          </div>

          <span className="hidden sm:inline-block text-[11px] text-secondary-text px-2 py-0.5 rounded bg-muted/60 border border-border/40">
            SYSTEM OPTIMAL
          </span>
        </div>

        {/* Real-time Clock */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[11px] text-secondary-text hidden md:inline">
            SYSTEM TIME:
          </span>
          <span className="text-sm font-bold tracking-widest text-foreground bg-card px-2.5 py-0.5 rounded border border-border">
            {mounted ? timeStr : "--:--:--"}
          </span>
        </div>
      </div>

      {/* Main Greeting & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
              {greetingTime}, {userName}
            </h1>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-secondary-text font-mono">
            {formattedDate} &bull; JARVIS Core is running. All personal operations synchronized.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/tasks">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono hover:border-primary/50">
              <Plus className="h-3.5 w-3.5 text-primary" />
              New Task
            </Button>
          </Link>
          <Link href="/meetings">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono hover:border-cyan-500/50">
              <Plus className="h-3.5 w-3.5 text-cyan-400" />
              New Meeting
            </Button>
          </Link>
          <Link href="/social">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono hover:border-purple-500/50">
              <Plus className="h-3.5 w-3.5 text-purple-400" />
              Plan Post
            </Button>
          </Link>
          <Link href="/notes">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono hover:border-blue-500/50">
              <Plus className="h-3.5 w-3.5 text-blue-400" />
              New Note
            </Button>
          </Link>
          <Link href="/reminders">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono hover:border-amber-500/50">
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              New Reminder
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
