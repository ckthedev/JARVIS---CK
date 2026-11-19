"use client";

import React from "react";
import Link from "next/link";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Plus,
  CheckSquare,
  FileText,
  Bell,
  Calendar,
  FolderOpen,
  Share2,
} from "lucide-react";
import { ProductivityInsight } from "@/modules/analytics/service";

interface SaasInsightsPanelProps {
  insights: ProductivityInsight[];
}

export function SaasInsightsPanel({ insights }: SaasInsightsPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-danger" />;
      case "attention":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getInsightBorder = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-danger/30 bg-danger/5";
      case "attention":
        return "border-warning/30 bg-warning/5";
      case "positive":
        return "border-success/30 bg-success/5";
      default:
        return "border-primary/20 bg-accent-subtle";
    }
  };

  const quickActions = [
    { label: "New Task", desc: "Backlog & Schedule", href: "/tasks", icon: CheckSquare, color: "text-primary bg-primary/10" },
    { label: "Take Note", desc: "Knowledge Vault", href: "/notes", icon: FileText, color: "text-secondary bg-secondary/10" },
    { label: "Set Reminder", desc: "Time & Channel Alert", href: "/reminders", icon: Bell, color: "text-warning bg-warning/10" },
    { label: "Schedule Meeting", desc: "Event & Attendees", href: "/meetings", icon: Calendar, color: "text-primary bg-primary/10" },
    { label: "Upload File", desc: "Secure Document Store", href: "/files", icon: FolderOpen, color: "text-warning bg-warning/10" },
    { label: "Plan Social Post", desc: "Multi-Platform Draft", href: "/social", icon: Share2, color: "text-secondary bg-secondary/10" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Automated Productivity Insights (7 of 12 cols) */}
      <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 shadow-saas flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-subtle text-primary">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-text tracking-tight">
                  Productivity Intelligence & Insights
                </h3>
                <p className="text-xs text-secondary-text mt-0.5">
                  Automated heuristics computed from your active execution data
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-secondary-text rounded-full bg-muted px-2 py-0.5 border border-border">
              {insights.length} insight{insights.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${getInsightBorder(
                  insight.type
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getInsightIcon(insight.type)}</div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-primary-text">
                      {insight.title}
                    </h4>
                    <p className="text-[11px] text-secondary-text leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>

                {insight.linkHref && (
                  <Link
                    href={insight.linkHref}
                    className="shrink-0 text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{insight.linkText || "Review"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-border mt-3 text-xs text-secondary-text">
          Insights evaluate backlog deadlines, scheduled meetings, and reminder queues.
        </div>
      </div>

      {/* 2. Direct Quick Actions Launcher Grid (5 of 12 cols) */}
      <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-5 shadow-saas flex flex-col justify-between">
        <div>
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-semibold text-primary-text tracking-tight">
              Direct Quick Actions
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">
              Instant entry points into JARVIS execution modules
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col p-3 rounded-xl border border-border/80 hover:border-primary/40 hover:bg-muted transition-all group shadow-saas"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${action.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <Plus className="h-3.5 w-3.5 text-secondary-text group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-primary-text group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                  <span className="text-[10px] text-secondary-text mt-0.5 truncate">
                    {action.desc}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-border mt-3 text-xs text-secondary-text">
          Full shortcuts available via <kbd className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-primary-text">⌘K</kbd> search bar
        </div>
      </div>
    </div>
  );
}
