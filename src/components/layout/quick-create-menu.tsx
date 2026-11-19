"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckSquare, Calendar, Share2, FileText, FolderOpen, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickCreateMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { label: "New Task", href: "/tasks", icon: CheckSquare, desc: "Add to backlog or schedule" },
    { label: "Schedule Meeting", href: "/meetings", icon: Calendar, desc: "Calendar event & agenda" },
    { label: "Plan Social Post", href: "/social", icon: Share2, desc: "Draft for multiple platforms" },
    { label: "Take Note", href: "/notes", icon: FileText, desc: "Rich knowledge note" },
    { label: "Upload File", href: "/files", icon: FolderOpen, desc: "Add to secure vault" },
    { label: "Set Reminder", href: "/reminders", icon: Bell, desc: "One-shot or recurring alert" },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 h-8 px-2.5 text-xs font-medium bg-[#383838] hover:bg-[#454545] text-[#F5F5F5] border border-[#484848]/40 shadow-sm"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Create</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#303030] bg-[#202020] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#737373] border-b border-[#292929] mb-1">
            Quick Actions
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#F5F5F5] hover:bg-[#262626] transition-colors group"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#181818] border border-[#292929] text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-xs leading-none text-[#F5F5F5]">{item.label}</div>
                  <div className="text-[10px] text-[#737373] mt-0.5">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
