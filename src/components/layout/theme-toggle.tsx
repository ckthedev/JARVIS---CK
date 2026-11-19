"use client";

import React from "react";
import { Moon } from "lucide-react";

export function ThemeToggle() {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-cockpit-border bg-cockpit-card text-emerald-400"
      title="Permanent Dark Cockpit NOC Theme"
    >
      <Moon className="h-4 w-4" />
    </div>
  );
}
