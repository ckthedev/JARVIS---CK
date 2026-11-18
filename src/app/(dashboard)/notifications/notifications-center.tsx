"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  Trash2,
  ExternalLink,
  CheckCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Share2,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationsCenter() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("type", activeTab);
      if (unreadOnly) params.set("unreadOnly", "true");
      params.set("limit", "100");

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?clearAll=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "REMINDER":
        return <Bell className="h-4 w-4 text-amber-400" />;
      case "TASK":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "MEETING":
        return <Calendar className="h-4 w-4 text-emerald-400" />;
      case "SOCIAL":
        return <Share2 className="h-4 w-4 text-purple-400" />;
      case "WARNING":
      case "ALERT":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const tabs = [
    { id: "ALL", label: "All" },
    { id: "REMINDER", label: "Reminders" },
    { id: "TASK", label: "Tasks" },
    { id: "MEETING", label: "Meetings" },
    { id: "SOCIAL", label: "Social Media" },
    { id: "SYSTEM", label: "System" },
  ];

  return (
    <div className="space-y-4">
      {/* Top action toolbar & filter tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
                activeTab === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-secondary-text hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs border transition-colors",
              unreadOnly
                ? "bg-amber-400/20 border-amber-400 text-amber-400 font-medium"
                : "border-border/80 bg-sidebar text-secondary-text hover:text-foreground"
            )}
          >
            Unread only
          </button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="h-8 gap-1 text-xs border-border/80 bg-sidebar text-primary hover:text-primary-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="h-8 gap-1 text-xs text-secondary-text hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className="h-8 px-2 text-secondary-text hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
          </Button>
        </div>
      </div>

      {/* Notifications listing */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card p-8">
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              unreadOnly
                ? "You have zero unread notifications. All alerts have been reviewed."
                : "Your notification inbox is clean. New reminders, meeting alerts, and task deadlines will appear here."
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-3 p-4 rounded-xl border transition-colors",
                !n.isRead
                  ? "bg-card border-primary/40 shadow-sm shadow-primary/5"
                  : "bg-card/50 border-border/60 hover:border-border"
              )}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 p-2 rounded-lg bg-sidebar border border-border/60 shrink-0">
                  {getTypeIcon(n.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={cn(
                        "text-sm font-semibold truncate",
                        !n.isRead ? "text-foreground" : "text-foreground/80"
                      )}
                    >
                      {n.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-secondary-text">
                      {n.type}
                    </Badge>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-secondary-text whitespace-pre-line">
                    {n.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-secondary-text">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(n.createdAt)}
                    </span>
                    {n.link && (
                      <a
                        href={n.link}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        View Related Item <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markSingleRead(n.id)}
                    title="Mark as read"
                    className="h-8 w-8 p-0 text-secondary-text hover:text-primary"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(n.id)}
                  title="Delete notification"
                  className="h-8 w-8 p-0 text-secondary-text hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
