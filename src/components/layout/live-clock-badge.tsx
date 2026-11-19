"use client";

import React, { useEffect, useState } from "react";

export function LiveClockBadge() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#303030] bg-[#202020] px-2.5 py-1 text-xs font-mono">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A3A3A3] opacity-50" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A3A3A3]" />
      </span>
      <span className="text-[10px] font-semibold tracking-wider text-[#A3A3A3]">LIVE</span>
      <span className="text-[11px] text-[#F5F5F5] font-medium">{timeStr || "--:--:--"}</span>
    </div>
  );
}
