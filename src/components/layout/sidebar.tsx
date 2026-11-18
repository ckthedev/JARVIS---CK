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
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bot,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  CheckSquare,
  Share2,
  Bell,
  Calendar,
  FileText,
  FolderOpen,
  Settings,
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:static",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary transition-all group-hover:shadow-jarvis-glow">
              <Bot className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-widest text-foreground font-mono">
                  JARVIS
                </span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                  AI Core v1.0
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-secondary-text hover:text-foreground hover:bg-sidebar-accent transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-2 mb-2">
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">
                Modules
              </p>
            )}
          </div>

          {siteConfig.mainNav.map((item) => {
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-secondary-text hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-secondary-text group-hover:text-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}
                {item.badge && !collapsed && (
                  <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded bg-background/60 border border-border/40 font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-primary font-semibold tracking-wider">ONLINE</span>
              </div>
              <span className="text-secondary-text">12ms</span>
            </div>
          )}

          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group",
              pathname === "/settings"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-secondary-text hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={handleSignOut}
            title={collapsed ? "Logout" : undefined}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-secondary-text hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
