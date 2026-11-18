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

        // If new unread notifications arrived while app is running, play melodic chime
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
        return <Bell className="h-3.5 w-3.5 text-amber-400" />;
      case "TASK":
        return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
      case "MEETING":
        return <Calendar className="h-3.5 w-3.5 text-emerald-400" />;
      case "SOCIAL":
        return <Share2 className="h-3.5 w-3.5 text-purple-400" />;
      case "WARNING":
      case "ALERT":
        return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <Info className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-secondary-text hover:text-foreground hover:bg-card-hover transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-background animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border p-3 px-4 bg-[#0A101C]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-secondary-text">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-secondary-text">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3.5 transition-colors hover:bg-sidebar-accent/50 flex items-start gap-3",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <div className="mt-0.5 p-1.5 rounded bg-sidebar border border-border/60 shrink-0">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-secondary-text shrink-0">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-secondary-text line-clamp-2">
                      {n.message}
                    </p>
                    {n.link && (
                      <a
                        href={n.link}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        View Details <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markSingleRead(n.id)}
                      title="Mark as read"
                      className="shrink-0 p-1 text-secondary-text hover:text-primary transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer with direct link to full /notifications page */}
          <div className="p-2 border-t border-border bg-[#0A101C] text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs text-primary hover:underline font-medium w-full py-1"
            >
              Open Notifications Center <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
