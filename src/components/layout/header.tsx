"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { siteConfig } from "@/config/site";
import { NotificationsPopover } from "./notifications-popover";
import { UserNav } from "./user-nav";
import { QuickCreateMenu } from "./quick-create-menu";
import { LiveClockBadge } from "./live-clock-badge";
import { Menu, Search, Command } from "lucide-react";

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();

  const currentNav =
    siteConfig.mainNav.find(
      (item) =>
        item.href === pathname ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    ) ||
    siteConfig.bottomNav.find((item) => pathname.startsWith(item.href)) || {
      title: "Dashboard",
      description: "Overview of your personal productivity command center.",
    };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#303030] bg-[#141414]/95 backdrop-blur-md px-4 sm:px-6 transition-colors shadow-sm">
      {/* Left: Mobile Toggle & Page Title with Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#303030] bg-[#202020] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] lg:hidden"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A3A3A3] font-medium">
            <span className="hover:text-[#F5F5F5] transition-colors font-mono tracking-wider">
              JARVIS
            </span>
            <span className="text-[#303030]">•</span>
            <span className="text-[#F5F5F5] font-semibold">{currentNav.title}</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#F5F5F5] tracking-tight leading-tight">
            {currentNav.title}
          </h2>
        </div>
      </div>

      {/* Center: Global Search Interface */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#737373]" />
          <input
            type="text"
            readOnly
            placeholder="Search tasks, meetings, files, notes... (Ctrl+K)"
            className="h-8 w-full rounded-lg border border-[#303030] bg-[#181818] pl-8 pr-12 text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:bg-[#202020] focus:border-[#454545] cursor-pointer transition-colors"
          />
          <div className="absolute right-2 top-1.5 flex items-center gap-0.5 rounded border border-[#303030] bg-[#262626] px-1.5 py-0.5 text-[9px] font-mono text-[#A3A3A3]">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Create, Notifications, Live Clock Badge & User Nav */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <QuickCreateMenu />
        <div className="h-4 w-px bg-[#303030]" />
        <NotificationsPopover />
        <div className="h-4 w-px bg-[#303030]" />
        <LiveClockBadge />
        <div className="h-4 w-px bg-[#303030]" />
        <UserNav user={user} />
      </div>
    </header>
  );
}
