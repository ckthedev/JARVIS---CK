import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { taskService } from "@/modules/tasks/service";
import { meetingService } from "@/modules/meetings/service";
import { reminderService } from "@/modules/reminders/service";
import { noteService } from "@/modules/notes/service";
import { analyticsService } from "@/modules/analytics/service";

// Master Dark Dashboard Components
import { DashboardWelcomeBanner } from "@/components/dashboard/dashboard-welcome-banner";
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards";
import { DashboardProductivityAnalytics } from "@/components/dashboard/dashboard-productivity-analytics";
import { DashboardTasksWidget } from "@/components/dashboard/dashboard-tasks-widget";
import { DashboardMeetingsWidget } from "@/components/dashboard/dashboard-meetings-widget";
import { DashboardWorldClock } from "@/components/dashboard/dashboard-world-clock";
import { DashboardQuickIdeas } from "@/components/dashboard/dashboard-quick-ideas";
import { DashboardUpcomingReminders } from "@/components/dashboard/dashboard-upcoming-reminders";
import { DashboardRecentActivity } from "@/components/dashboard/dashboard-recent-activity";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Parallel Database Queries across all core modules
  const [
    taskStats,
    allTasks,
    projects,
    todayMeetings,
    upcomingMeetings,
    recentNotes,
    upcomingReminders,
    analytics,
  ] = await Promise.all([
    taskService.getDashboardTaskStats(user.id),
    taskService.getTasks(user.id, { limit: 60 }),
    taskService.getProjects(user.id),
    meetingService.getMeetings(user.id, {
      section: "today",
      sortBy: "startTime",
      sortOrder: "asc",
    }),
    meetingService.getUpcomingMeetings(user.id, 1),
    noteService.getNotes(user.id, {
      limit: 8,
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
    reminderService.getUpcomingReminders(user.id, 6),
    analyticsService.getDashboardAnalytics(user.id),
  ]);

  // Greeting computation based on local hour
  const now = new Date();
  const hour = now.getHours();
  let greetingTime = "Good evening";
  if (hour < 12) greetingTime = "Good morning";
  else if (hour < 18) greetingTime = "Good afternoon";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const userName = user.name ? user.name.split(" ")[0] : "CK";
  const nextMeetingTitle =
    upcomingMeetings.length > 0 ? upcomingMeetings[0].title : null;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. Large Personalized Welcome Banner & Quick Action Shortcuts */}
      <DashboardWelcomeBanner
        userName={userName}
        greetingTime={greetingTime}
        formattedDate={formattedDate}
        todayTasksCount={taskStats.today}
        overdueTasksCount={taskStats.overdue}
        todayMeetingsCount={todayMeetings.length}
      />

      {/* 2. 4 Quick Statistics Cards (Strictly authentic user metrics) */}
      <DashboardStatCards
        taskStats={taskStats}
        todayMeetingsCount={todayMeetings.length}
        activeProjectsCount={projects.length}
        nextMeetingTitle={nextMeetingTitle}
      />

      {/* 3. Main Command Centre Grid: 2-Column Responsive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Primary Workflows: 7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Productivity Analytics Panel */}
          <DashboardProductivityAnalytics
            weeklyProductivity={analytics.weeklyProductivity}
            statusDistribution={analytics.statusDistribution}
            taskStats={taskStats}
            completionRate={analytics.completionRate}
          />

          {/* My Tasks Widget with Fast Inline Completion & Status Tabs */}
          <DashboardTasksWidget initialTasks={allTasks} />

          {/* Today's Meetings Widget with Chronological Flow & Next-Up Highlight */}
          <DashboardMeetingsWidget todayMeetings={todayMeetings} />
        </div>

        {/* Right Column (Secondary / Time / Capture: 5 cols on lg, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* World Clock Widget with Live Universal Times & DST Offset */}
          <DashboardWorldClock />

          {/* Quick Notes & Ideas Widget with Direct Inline Capture */}
          <DashboardQuickIdeas initialNotes={recentNotes} />

          {/* Upcoming Reminders Widget with Quick Complete Action */}
          <DashboardUpcomingReminders initialReminders={upcomingReminders} />

          {/* Cross-Module Recent Activity Panel */}
          <DashboardRecentActivity
            activityTimeline={analytics.activityTimeline}
          />
        </div>
      </div>
    </div>
  );
}
