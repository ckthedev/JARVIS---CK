"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Megaphone,
  Hash,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SocialNavProps {
  onOpenCreate?: () => void;
}

export function SocialNav({ onOpenCreate }: SocialNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/social",
      label: "Overview",
      icon: LayoutDashboard,
      isActive: pathname === "/social",
    },
    {
      href: "/social/calendar",
      label: "Calendar",
      icon: CalendarDays,
      isActive: pathname.startsWith("/social/calendar"),
    },
    {
      href: "/social/posts",
      label: "Content Posts",
      icon: FileText,
      isActive: pathname.startsWith("/social/posts"),
    },
    {
      href: "/social/campaigns",
      label: "Campaigns",
      icon: Megaphone,
      isActive: pathname.startsWith("/social/campaigns"),
    },
    {
      href: "/social/hashtags",
      label: "Hashtags & Collections",
      icon: Hash,
      isActive: pathname.startsWith("/social/hashtags"),
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4 mb-6">
      <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                item.isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {onOpenCreate && (
        <Button
          onClick={onOpenCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 gap-1.5 shadow-sm shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create Post</span>
        </Button>
      )}
    </div>
  );
}
