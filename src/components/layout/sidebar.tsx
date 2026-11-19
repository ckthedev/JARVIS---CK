"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Share2,
  Bell,
  Calendar,
  CalendarDays,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Terminal,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  CheckSquare,
  Share2,
  Bell,
  Calendar,
  CalendarDays,
  FileText,
  FolderOpen,
  Settings,
  Layers,
  CalendarRange: CalendarDays,
};

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapse, mobileOpen, setMobileOpen } = useSidebar();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-[#303030] bg-[#141414] transition-all duration-300 ease-in-out lg:static",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#303030] bg-[#141414]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#262626] border border-[#383838] text-[#F5F5F5] transition-transform group-hover:scale-105">
              <Terminal className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-wider text-[#F5F5F5] font-mono">
                    JARVIS
                  </span>
                  <span className="rounded bg-[#262626] border border-[#383838] px-1 py-0.2 text-[9px] font-mono font-medium text-[#A3A3A3]">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-[#737373] tracking-tight leading-none">
                  Personal Assistant
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-[#737373] hover:text-[#F5F5F5] hover:bg-[#202020] transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Sectioned Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {siteConfig.sections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                    {section.title}
                  </p>
                </div>
              )}

              {section.items.map((item) => {
                const Icon = iconMap[item.iconName] || Shield;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]/60 font-medium shadow-sm"
                        : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020] border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[#F5F5F5]"
                          : "text-[#737373] group-hover:text-[#F5F5F5]"
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {item.badge && !collapsed && (
                      <span className="ml-auto rounded bg-[#262626] text-[#A3A3A3] border border-[#383838] px-1.5 py-0.2 text-[9px] font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Profile / Settings Footer */}
        <div className="border-t border-[#303030] p-3 space-y-1 bg-[#141414]">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all group",
              pathname === "/settings"
                ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]/60 font-medium"
                : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020] border border-transparent"
            )}
          >
            <Settings className="h-4 w-4 shrink-0 text-[#737373] group-hover:text-[#F5F5F5]" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#737373] hover:text-[#EF4444] hover:bg-[#2A1818] transition-all group"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
