"use client";

import React, { useState, useEffect } from "react";
import { Globe, Sun, Moon, Clock } from "lucide-react";

interface WorldRegion {
  city: string;
  country: string;
  timeZone: string;
  code: string;
}

const REGIONS: WorldRegion[] = [
  {
    city: "New Delhi",
    country: "India",
    timeZone: "Asia/Kolkata",
    code: "IST",
  },
  {
    city: "Dubai",
    country: "UAE",
    timeZone: "Asia/Dubai",
    code: "GST",
  },
  {
    city: "London",
    country: "United Kingdom",
    timeZone: "Europe/London",
    code: "GMT",
  },
  {
    city: "New York",
    country: "United States",
    timeZone: "America/New_York",
    code: "EST",
  },
  {
    city: "Singapore",
    country: "Singapore",
    timeZone: "Asia/Singapore",
    code: "SGT",
  },
];

// Helper to compute timezone offset in minutes dynamically with DST awareness
function getTimezoneOffsetMinutes(tz: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => {
      const p = parts.find((item) => item.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };

    const hour = get("hour") === 24 ? 0 : get("hour");
    const targetDate = new Date(
      Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        hour,
        get("minute"),
        get("second")
      )
    );

    return Math.round((targetDate.getTime() - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}

export function DashboardWorldClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-[#292929]">
          <Globe className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">World Clock</h2>
        </div>
        <div className="py-8 text-center text-xs text-[#737373]">
          Synchronizing world clocks...
        </div>
      </div>
    );
  }

  // Get user local timezone
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const userOffsetMinutes = getTimezoneOffsetMinutes(userTz, now);

  return (
    <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">World Clock</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-[#737373]">
          <Clock className="h-3 w-3 text-[#A3A3A3]" />
          Live Time
        </span>
      </div>

      {/* Region Clocks Grid */}
      <div className="mt-3.5 space-y-2">
        {REGIONS.map((region) => {
          // Format local time for this timezone
          const timeStr = now.toLocaleTimeString("en-US", {
            timeZone: region.timeZone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });

          // Format date for this timezone
          const dateStr = now.toLocaleDateString("en-US", {
            timeZone: region.timeZone,
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          // Compute 24h local hour to determine day vs night
          const hour24 = parseInt(
            now.toLocaleTimeString("en-US", {
              timeZone: region.timeZone,
              hour: "numeric",
              hour12: false,
            }),
            10
          );
          const isDaytime = hour24 >= 6 && hour24 < 18;

          // Compute relative difference from user's current timezone
          const zoneOffsetMinutes = getTimezoneOffsetMinutes(region.timeZone, now);
          const diffMinutes = zoneOffsetMinutes - userOffsetMinutes;
          const diffHours = diffMinutes / 60;

          let offsetLabel = "Local Time";
          if (diffHours > 0) {
            const formatted = diffHours % 1 === 0 ? diffHours : diffHours.toFixed(1);
            offsetLabel = `+${formatted} hrs`;
          } else if (diffHours < 0) {
            const formatted = diffHours % 1 === 0 ? diffHours : diffHours.toFixed(1);
            offsetLabel = `${formatted} hrs`;
          }

          const isLocalZone = region.timeZone === userTz || diffMinutes === 0;

          return (
            <div
              key={region.city}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                isLocalZone
                  ? "border-[#404040] bg-[#242424]"
                  : "border-[#292929] bg-[#181818] hover:bg-[#202020]"
              }`}
            >
              {/* City + Country + Offset */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#F5F5F5] truncate">
                    {region.city}
                  </span>
                  {isLocalZone && (
                    <span className="rounded bg-[#2E2E2E] border border-[#3E3E3E] text-[#D4D4D4] px-1 py-0.2 text-[9px] font-medium">
                      YOU
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#737373]">
                  <span>{region.country}</span>
                  <span className="text-[#303030]">•</span>
                  <span
                    className={`font-medium ${
                      isLocalZone ? "text-[#A3A3A3]" : "text-[#737373]"
                    }`}
                  >
                    {offsetLabel}
                  </span>
                </div>
              </div>

              {/* Live Digital Clock + Day/Night */}
              <div className="flex items-center gap-2.5 text-right shrink-0">
                <div>
                  <div className="text-xs sm:text-sm font-semibold font-mono text-[#F5F5F5] tracking-tight">
                    {timeStr}
                  </div>
                  <div className="text-[10px] text-[#737373] mt-0.5">
                    {dateStr} <span className="text-[#A3A3A3]">({region.code})</span>
                  </div>
                </div>

                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2D2D2D] bg-[#202020] text-[#737373]"
                  title={isDaytime ? "Daytime" : "Nighttime"}
                >
                  {isDaytime ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
