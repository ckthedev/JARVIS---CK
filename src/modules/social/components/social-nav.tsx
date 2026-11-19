"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  FileEdit,
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
      label: "Content Calendar",
      icon: CalendarDays,
      isActive: pathname.startsWith("/social/calendar"),
    },
    {
      href: "/social/posts",
      label: "All Posts",
      icon: FileText,
      isActive: pathname === "/social/posts",
    },
    {
      href: "/social/posts?status=DRAFT",
      label: "Drafts",
      icon: FileEdit,
      isActive: pathname === "/social/posts?status=DRAFT",
    },
    {
      href: "/social/campaigns",
      label: "Campaigns",
      icon: Megaphone,
      isActive: pathname.startsWith("/social/campaigns"),
    },
    {
      href: "/social/hashtags",
      label: "Hashtag Library",
      icon: Hash,
      isActive: pathname.startsWith("/social/hashtags"),
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#303030] pb-4 mb-6">
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border",
                item.isActive
                  ? "bg-[#262626] text-[#F5F5F5] border-[#8B5CF6]/50 font-semibold"
                  : "bg-[#202020] text-[#A3A3A3] border-[#303030] hover:text-[#F5F5F5] hover:bg-[#2C2C2C]"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", item.isActive ? "text-[#8B5CF6]" : "text-[#737373]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {onOpenCreate && (
        <Button
          size="sm"
          onClick={onOpenCreate}
          className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shrink-0 gap-1.5 h-8 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Quick Create Post</span>
        </Button>
      )}
    </div>
  );
}
