"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { siteConfig } from "@/config/site";
import { NotificationsPopover } from "./notifications-popover";
import { UserNav } from "./user-nav";
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
      description: "Overview of your personal productivity matrix.",
    };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-secondary-text hover:text-foreground lg:hidden"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            {currentNav.title}
          </h2>
          <p className="hidden md:block text-[11px] text-secondary-text">
            {currentNav.description}
          </p>
        </div>
      </div>

      {/* Center: Search Interface Placeholder */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            readOnly
            placeholder="Search tasks, meetings, files, notes..."
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none cursor-pointer"
          />
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded border border-border bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-secondary-text">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications & User Nav */}
      <div className="flex items-center gap-3">
        <NotificationsPopover />
        <div className="h-4 w-px bg-border" />
        <UserNav user={user} />
      </div>
    </header>
  );
}
