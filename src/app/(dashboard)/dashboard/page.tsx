import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { taskService } from "@/modules/tasks/service";
import { meetingService } from "@/modules/meetings/service";
import { reminderService } from "@/modules/reminders/service";
import { socialService } from "@/modules/social/service";
import { noteService } from "@/modules/notes/service";
import { fileService } from "@/modules/files/service";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, formatBytes, cn } from "@/lib/utils";
import { formatKolkataDate, isDueTodayKolkata, isOverdueKolkata } from "@/lib/utils/timezone";
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  Bell,
  Share2,
  FileText,
  FolderOpen,
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
  Layers,
  Sun,
  Flame,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Real Database Queries
  const [
    taskStats,
    recentTasks,
    upcomingMeetings,
    upcomingReminders,
    scheduledPosts,
    recentNotes,
    noteStats,
    recentFiles,
    reminderStats,
  ] = await Promise.all([
    taskService.getDashboardTaskStats(user.id),
    taskService.getTasks(user.id, { limit: 5 }),
    meetingService.getUpcomingMeetings(user.id, 4),
    reminderService.getUpcomingReminders(user.id, 4),
    socialService.getScheduledPosts(user.id, 4),
    noteService.getRecentNotes(user.id, 4),
    noteService.getDashboardNoteStats(user.id),
    fileService.getRecentFiles(user.id, 4),
    reminderService.getReminderStats(user.id),
  ]);

  // Greeting computation
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

  return (
    <div className="space-y-8">
      {/* Personalized Greeting & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greetingTime}, {user.name.split(" ")[0]}
            </h1>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <p className="mt-1 text-sm text-secondary-text">
            {formattedDate} &bull; JARVIS Core status is optimal.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/tasks">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5 text-primary" />
              New Task
            </Button>
          </Link>
          <Link href="/notes">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5 text-secondary" />
              New Note
            </Button>
          </Link>
          <Link href="/meetings">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              New Meeting
            </Button>
          </Link>
          <Link href="/reminders">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              New Reminder
            </Button>
          </Link>
        </div>
      </div>

      {/* Task Summary Metrics - 8 Real Metrics with Direct Navigation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-secondary-text">
            Task Overview & Live Metrics
          </h2>
          <Link
            href="/tasks"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Open Task Manager <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/tasks?view=all"
            className="group block focus:outline-none focus:ring-1 focus:ring-primary rounded-xl"
            title="View all active tasks"
          >
            <StatCard
              title="Total Active"
              value={taskStats.totalActive}
              subtitle="All open & pending tasks"
              icon={Layers}
              badge={{ text: "Active", variant: "default" }}
              className="group-hover:border-primary/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=my-day"
            className="group block focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-xl"
            title="View tasks due today (Asia/Kolkata)"
          >
            <StatCard
              title="Due Today"
              value={taskStats.today}
              subtitle="Current day agenda"
              icon={Sun}
              badge={{
                text: "My Day",
                variant: taskStats.today > 0 ? "warning" : "outline",
              }}
              className="group-hover:border-amber-400/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=upcoming"
            className="group block focus:outline-none focus:ring-1 focus:ring-primary rounded-xl"
            title="View upcoming tasks"
          >
            <StatCard
              title="Upcoming"
              value={taskStats.upcoming}
              subtitle="Future deadlines"
              icon={Calendar}
              badge={{ text: "Scheduled", variant: "secondary" }}
              className="group-hover:border-primary/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=overdue"
            className="group block focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl"
            title="View overdue tasks"
          >
            <StatCard
              title="Overdue"
              value={taskStats.overdue}
              subtitle="Past scheduled deadline"
              icon={AlertTriangle}
              badge={{
                text: taskStats.overdue > 0 ? "Action Required" : "Clear",
                variant: taskStats.overdue > 0 ? "destructive" : "outline",
              }}
              className="group-hover:border-red-500/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=all&status=IN_PROGRESS"
            className="group block focus:outline-none focus:ring-1 focus:ring-secondary rounded-xl"
            title="View tasks currently in progress"
          >
            <StatCard
              title="In Progress"
              value={taskStats.inProgress}
              subtitle="Under active execution"
              icon={Clock}
              badge={{ text: "Working", variant: "secondary" }}
              className="group-hover:border-secondary/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=all&status=TODO"
            className="group block focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-xl"
            title="View backlog tasks to do"
          >
            <StatCard
              title="To Do"
              value={taskStats.todo}
              subtitle="Queued in backlog"
              icon={CheckSquare}
              badge={{ text: "Pending", variant: "default" }}
              className="group-hover:border-blue-400/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=all&priority=CRITICAL"
            className="group block focus:outline-none focus:ring-1 focus:ring-red-400 rounded-xl"
            title="View critical priority tasks"
          >
            <StatCard
              title="Critical Priority"
              value={taskStats.critical}
              subtitle="Top urgency tasks"
              icon={Flame}
              badge={{
                text: taskStats.critical > 0 ? "Urgent" : "None",
                variant: taskStats.critical > 0 ? "destructive" : "outline",
              }}
              className="group-hover:border-red-400/50 transition-colors cursor-pointer"
            />
          </Link>

          <Link
            href="/tasks?view=completed"
            className="group block focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded-xl"
            title="View completed tasks"
          >
            <StatCard
              title="Completed"
              value={taskStats.completed}
              subtitle="Finished tasks"
              icon={CheckCircle2}
              badge={{ text: "Done", variant: "success" }}
              className="group-hover:border-emerald-400/50 transition-colors cursor-pointer"
            />
          </Link>
        </div>
      </div>

      {/* Priority Focus & Recent Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Priority Focus & Recent Tasks
            </CardTitle>
            <CardDescription>
              Tasks requiring your immediate attention and recent activity
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tasks"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View all tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks recorded yet"
              description="Your task queue is completely empty. Create a task to get organized."
              action={
                <Link href="/tasks">
                  <Button size="sm" variant="outline">
                    Create First Task
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {recentTasks.map((task) => {
                const isOverdue = isOverdueKolkata(task.dueDate, task.status);
                const isDueToday = isDueTodayKolkata(task.dueDate);
                const projectColor = task.project?.color || "#00D4FF";
                const categoryColor = task.category?.color || "#7A3FFF";
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-[#0A101C] p-3 transition-colors hover:border-border/80"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </h4>
                        {task.project && (
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border"
                            style={{
                              backgroundColor: `${projectColor}15`,
                              color: projectColor,
                              borderColor: `${projectColor}35`,
                            }}
                          >
                            {task.project.name}
                          </span>
                        )}
                        {task.category && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-secondary-text">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: categoryColor }}
                            />
                            {task.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-secondary-text">
                        {task.dueDate && (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[11px]",
                              isOverdue && "text-red-400 font-semibold",
                              isDueToday && !isOverdue && "text-amber-400 font-medium"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {isOverdue
                              ? "Overdue: "
                              : isDueToday
                              ? "Due Today: "
                              : "Due: "}
                            {formatKolkataDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          task.priority === "CRITICAL"
                            ? "destructive"
                            : task.priority === "HIGH"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant={
                          task.status === "COMPLETED"
                            ? "success"
                            : task.status === "IN_PROGRESS"
                            ? "secondary"
                            : task.status === "CANCELLED"
                            ? "outline"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Link
                        href={`/tasks?view=all&search=${encodeURIComponent(task.title)}`}
                        className="rounded-md border border-border p-1.5 text-secondary-text hover:text-primary hover:border-primary/40 transition-colors"
                        title="Open task in Task Manager"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Grid: Upcoming Meetings & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Meetings
              </CardTitle>
              <CardDescription>
                Synchronized schedule from your calendar
              </CardDescription>
            </div>
            <Link
              href="/meetings"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming meetings"
                description="Your calendar is completely clear for the upcoming days."
                action={
                  <Link href="/meetings">
                    <Button size="sm" variant="outline">
                      Schedule a Meeting
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between rounded-md border border-border bg-[#0A101C] p-3 transition-colors hover:border-border/80"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {meeting.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-secondary-text">
                        <span>
                          {formatDate(meeting.startTime)} at{" "}
                          {formatTime(meeting.startTime)}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {meeting.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {meeting.meetingUrl && (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border p-2 text-primary hover:bg-sidebar-accent"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-400" />
                  Upcoming Reminders
                </CardTitle>
                {reminderStats.overdue > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1">
                    {reminderStats.overdue} Overdue
                  </Badge>
                )}
                {reminderStats.today > 0 && (
                  <Badge variant="warning" className="text-[10px] h-4 px-1">
                    {reminderStats.today} Today
                  </Badge>
                )}
              </div>
              <CardDescription>
                Time-critical follow-ups, alarms, and notifications
              </CardDescription>
            </div>
            <Link
              href="/reminders"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No active reminders"
                description="No pending alerts. You have attended to all scheduled items."
                action={
                  <Link href="/reminders">
                    <Button size="sm" variant="outline">
                      Add Reminder
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between rounded-md border border-border bg-[#0A101C] p-3 transition-colors hover:border-border/80"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-foreground">
                          {reminder.title}
                        </h4>
                        {reminder.isRecurring && (
                          <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 rounded">
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-text">
                        Due: {formatDate(reminder.dueAt)} at{" "}
                        {formatTime(reminder.dueAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        reminder.priority === "CRITICAL"
                          ? "destructive"
                          : reminder.priority === "HIGH"
                          ? "warning"
                          : "outline"
                      }
                      className="text-[10px] uppercase"
                    >
                      {reminder.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid: Social Media Schedule & Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Media Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#A78BFA]" />
                Social Media Schedule
              </CardTitle>
              <CardDescription>
                Upcoming posts queued for publication
              </CardDescription>
            </div>
            <Link
              href="/social"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {scheduledPosts.length === 0 ? (
              <EmptyState
                icon={Share2}
                title="No scheduled posts"
                description="Your social media queue is currently empty."
                action={
                  <Link href="/social">
                    <Button size="sm" variant="outline">
                      Schedule a Post
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-md border border-border bg-[#0A101C] p-3 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-secondary">
                        {post.platform || "MULTI-CHANNEL"} &bull; {post.accountName || "Default"}
                      </span>
                      <Badge variant="outline">{post.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-foreground line-clamp-2">
                      {post.content}
                    </p>
                    {post.scheduledFor && (
                      <p className="mt-2 text-[11px] text-secondary-text">
                        Scheduled: {formatDate(post.scheduledFor)} at {formatTime(post.scheduledFor)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Recent Notes
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-secondary-text font-normal">
                  {noteStats.totalActive} Active &bull; {noteStats.pinned} Pinned
                </Badge>
              </div>
              <CardDescription>
                Knowledge base entries, rich documentation and quick snippets
              </CardDescription>
            </div>
            <Link
              href="/notes"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              All Notes <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No notes created yet"
                description="Capture your ideas, meeting takeaways, and project notes here."
                action={
                  <Link href="/notes">
                    <Button size="sm" variant="outline">
                      Create First Note
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes?note=${note.id}`}
                    className="group block rounded-md border border-border bg-[#0A101C] p-3 transition-colors hover:border-primary/50 hover:bg-[#101725]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {note.title || "Untitled Note"}
                        </h4>
                        {note.category && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border"
                            style={{
                              backgroundColor: `${note.category.color || "#00D4FF"}15`,
                              color: note.category.color || "#00D4FF",
                              borderColor: `${note.category.color || "#00D4FF"}35`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: note.category.color || "#00D4FF" }}
                            />
                            {note.category.name}
                          </span>
                        )}
                      </div>
                      {note.isPinned && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-secondary-text line-clamp-2">
                      {note.plainText || "Empty document"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {note.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded text-secondary-text"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-secondary-text">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Uploaded Files Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Recently Uploaded Files
            </CardTitle>
            <CardDescription>
              Local secure storage tracking
            </CardDescription>
          </div>
          <Link
            href="/files"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Open File Manager <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentFiles.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No files stored yet"
              description="Your secure local file repository is ready. File uploading will be managed in the File Manager module."
              action={
                <Link href="/files">
                  <Button size="sm" variant="outline">
                    Explore File Manager
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="rounded-md border border-border bg-[#0A101C] p-3 transition-colors hover:border-border/80 space-y-2"
                >
                  <p className="text-xs font-semibold text-foreground truncate">
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-secondary-text">
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
