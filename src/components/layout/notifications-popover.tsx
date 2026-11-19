"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Share2,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { playNotificationChime } from "@/lib/notifications/sound";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastUnreadRef = useRef<number>(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const count = data.unreadCount || 0;

        // If new unread notifications arrived while app is running, play chime
        if (count > lastUnreadRef.current && lastUnreadRef.current !== 0) {
          playNotificationChime("subtle");
        }
        lastUnreadRef.current = count;

        setNotifications(items);
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Check every 30 seconds for new alerts
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        lastUnreadRef.current = 0;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      lastUnreadRef.current = Math.max(0, lastUnreadRef.current - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "REMINDER":
        return <Bell className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "TASK":
        return <CheckCircle2 className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "MEETING":
        return <Calendar className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "SOCIAL":
        return <Share2 className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "WARNING":
      case "ALERT":
        return <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />;
      default:
        return <Info className="h-3.5 w-3.5 text-[#737373]" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#303030] bg-[#202020] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#282828] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#383838] border border-[#484848] px-1 text-[9px] font-bold text-[#F5F5F5]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#303030] bg-[#202020] shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#292929] p-3 px-4 bg-[#181818]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F5F5F5]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded bg-[#282828] border border-[#383838] px-1.5 py-0.2 text-[9px] font-medium text-[#A3A3A3]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#292929]">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#737373]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#737373]">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3.5 transition-colors hover:bg-[#252525] flex items-start gap-3",
                    !n.isRead && "bg-[#181818]/60"
                  )}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-[#181818] border border-[#292929] shrink-0">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium text-[#F5F5F5] truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#737373] shrink-0">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#737373] line-clamp-2">
                      {n.message}
                    </p>
                    {n.link && (
                      <a
                        href={n.link}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#A3A3A3] hover:text-[#F5F5F5]"
                      >
                        View Details <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markSingleRead(n.id)}
                      title="Mark as read"
                      className="shrink-0 p-1 text-[#737373] hover:text-[#F5F5F5] transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer with direct link to full /notifications page */}
          <div className="p-2.5 border-t border-[#292929] bg-[#181818] text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] font-medium w-full py-1 transition-colors"
            >
              Open Notifications Center <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
