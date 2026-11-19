"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Calendar,
  Bell,
  Share2,
  FileText,
  FolderOpen,
  ArrowRight,
  Clock,
} from "lucide-react";
import { TaskDto } from "@/modules/tasks/types";
import { MeetingDto } from "@/modules/meetings/types";
import { ReminderDto } from "@/modules/reminders/types";
import { SocialPostDto } from "@/modules/social/types";
import { ActivityTimelineItem } from "@/modules/analytics/service";
import { formatDate } from "@/lib/utils";

interface SaasScheduleAndActivityProps {
  todayTasks: TaskDto[];
  upcomingMeetings: MeetingDto[];
  upcomingReminders: ReminderDto[];
  scheduledPosts: SocialPostDto[];
  activityTimeline: ActivityTimelineItem[];
}

export function SaasScheduleAndActivity({
  todayTasks,
  upcomingMeetings,
  upcomingReminders,
  scheduledPosts,
  activityTimeline,
}: SaasScheduleAndActivityProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "meetings" | "reminders" | "social">("tasks");

  const tabs = [
    { id: "tasks", label: "Tarefas Hoje", count: todayTasks.length, icon: CheckSquare },
    { id: "meetings", label: "Reuniões", count: upcomingMeetings.length, icon: Calendar },
    { id: "reminders", label: "Lembretes", count: upcomingReminders.length, icon: Bell },
    { id: "social", label: "Social Posts", count: scheduledPosts.length, icon: Share2 },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />;
      case "MEETING":
        return <Calendar className="h-3.5 w-3.5 text-cyan-400" />;
      case "NOTE":
        return <FileText className="h-3.5 w-3.5 text-amber-400" />;
      case "FILE":
        return <FolderOpen className="h-3.5 w-3.5 text-lime-400" />;
      case "REMINDER":
        return <Bell className="h-3.5 w-3.5 text-rose-400" />;
      case "SOCIAL":
        return <Share2 className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Upcoming Schedule Panel (7 of 12 cols) */}
      <div className="lg:col-span-7 rounded-xl border border-cockpit-border bg-cockpit-card p-4 sm:p-5 shadow-cockpit flex flex-col justify-between">
        <div>
          {/* Header & Tab Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cockpit-border pb-3 mb-4 font-mono">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Fila de Execução & Agenda
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Compromissos e entregas sincronizadas
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-cockpit-elevated p-1 border border-cockpit-border">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span
                      className={`ml-0.5 rounded px-1 text-[9px] font-bold ${
                        isSelected
                          ? "bg-emerald-500/30 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="min-h-[200px] font-mono text-xs">
            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div>
                {todayTasks.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhuma tarefa pendente para hoje. Fluxo em dia.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.slice(0, 5).map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks?id=${task.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-cockpit-border/80 bg-cockpit-elevated/40 hover:bg-cockpit-elevated transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              task.priority === "CRITICAL"
                                ? "bg-rose-500 shadow-sm"
                                : task.priority === "HIGH"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">
                            {task.dueDate ? formatDate(task.dueDate) : "Hoje"}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              task.status === "COMPLETED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : task.status === "IN_PROGRESS"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === "meetings" && (
              <div>
                {upcomingMeetings.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhuma reunião agendada. Horário de foco livre.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.slice(0, 5).map((meeting) => (
                      <Link
                        key={meeting.id}
                        href={`/meetings?id=${meeting.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-cockpit-border/80 bg-cockpit-elevated/40 hover:bg-cockpit-elevated transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                              {meeting.title}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {formatDate(meeting.startTime)}
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-cockpit-elevated border border-cockpit-border px-2 py-0.5 text-[9px] font-semibold text-cyan-400 shrink-0">
                          {meeting.meetingType}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === "reminders" && (
              <div>
                {upcomingReminders.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhum lembrete imediato.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingReminders.slice(0, 5).map((reminder) => (
                      <Link
                        key={reminder.id}
                        href="/reminders"
                        className="flex items-center justify-between p-2.5 rounded-lg border border-cockpit-border/80 bg-cockpit-elevated/40 hover:bg-cockpit-elevated transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/15 text-amber-400 shrink-0">
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                            {reminder.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(reminder.dueAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Social Posts Tab */}
            {activeTab === "social" && (
              <div>
                {scheduledPosts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhum post agendado.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduledPosts.slice(0, 5).map((post) => (
                      <Link
                        key={post.id}
                        href={`/social/posts?id=${post.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-cockpit-border/80 bg-cockpit-elevated/40 hover:bg-cockpit-elevated transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/15 text-cyan-400 shrink-0">
                            <Share2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                            {post.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400 shrink-0">
                          {post.plannedAt ? formatDate(post.plannedAt) : "Agendado"}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel Footer */}
        <div className="pt-3 border-t border-cockpit-border mt-3 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[10px]">
            Sincronizado entre todos os módulos ativos
          </span>
          <Link
            href={
              activeTab === "tasks"
                ? "/tasks"
                : activeTab === "meetings"
                ? "/meetings"
                : activeTab === "reminders"
                ? "/reminders"
                : "/social"
            }
            className="text-emerald-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
          >
            Abrir módulo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 2. Recent Cross-Module Activity Timeline (5 of 12 cols) */}
      <div className="lg:col-span-5 rounded-xl border border-cockpit-border bg-cockpit-card p-4 sm:p-5 shadow-cockpit flex flex-col justify-between font-mono">
        <div>
          <div className="flex items-center justify-between border-b border-cockpit-border pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Auditoria de Eventos
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log recente de atividades do assistente
              </p>
            </div>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/40">
              Ao Vivo
            </span>
          </div>

          <div className="space-y-2.5">
            {activityTimeline.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Nenhuma atividade recente registrada.
              </div>
            ) : (
              activityTimeline.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-2.5 p-2 rounded-lg border border-cockpit-border/60 bg-cockpit-elevated/30 hover:bg-cockpit-elevated transition-colors group"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 shrink-0 mt-0.5">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-cockpit-border mt-3 text-right">
          <Link
            href="/tasks"
            className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center justify-end gap-1"
          >
            Ver todos os registros <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
