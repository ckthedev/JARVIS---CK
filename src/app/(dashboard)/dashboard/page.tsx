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
import { formatDate, formatTime, formatBytes } from "@/lib/utils";
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  Bell,
  Share2,
  FileText,
  FolderOpen,
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Real Database Queries
  const [
    taskStats,
    upcomingMeetings,
    upcomingReminders,
    scheduledPosts,
    recentNotes,
    recentFiles,
  ] = await Promise.all([
    taskService.getSummaryStats(user.id),
    meetingService.getUpcomingMeetings(user.id, 4),
    reminderService.getUpcomingReminders(user.id, 4),
    socialService.getScheduledPosts(user.id, 4),
    noteService.getRecentNotes(user.id, 4),
    fileService.getRecentFiles(user.id, 4),
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
        </div>
      </div>

      {/* Task Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={taskStats.total}
          subtitle="All recorded tasks"
          icon={CheckSquare}
          badge={{ text: "Active", variant: "default" }}
        />
        <StatCard
          title="In Progress"
          value={taskStats.inProgress}
          subtitle="Under active execution"
          icon={Clock}
          badge={{ text: "Working", variant: "secondary" }}
        />
        <StatCard
          title="Completed"
          value={taskStats.completed}
          subtitle="Successfully finished"
          icon={CheckSquare}
          badge={{ text: "Done", variant: "success" }}
        />
        <StatCard
          title="Urgent Priority"
          value={taskStats.urgent}
          subtitle="Requires immediate attention"
          icon={AlertCircle}
          badge={{
            text: taskStats.urgent > 0 ? "Action Required" : "Clear",
            variant: taskStats.urgent > 0 ? "destructive" : "outline",
          }}
        />
      </div>

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
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                Upcoming Reminders
              </CardTitle>
              <CardDescription>
                Time-critical follow-ups and notifications
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
                      <h4 className="text-sm font-medium text-foreground">
                        {reminder.title}
                      </h4>
                      <p className="text-xs text-secondary-text">
                        Due: {formatDate(reminder.dueAt)} at{" "}
                        {formatTime(reminder.dueAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        reminder.priority === "URGENT"
                          ? "destructive"
                          : reminder.priority === "HIGH"
                          ? "warning"
                          : "outline"
                      }
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
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Recent Notes
              </CardTitle>
              <CardDescription>
                Knowledge base entries and quick snippets
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
                  <div
                    key={note.id}
                    className="rounded-md border border-border bg-[#0A101C] p-3 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        {note.title}
                      </h4>
                      {note.isPinned && (
                        <Badge variant="secondary">Pinned</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-secondary-text line-clamp-2">
                      {note.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded text-secondary-text"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-secondary-text">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  </div>
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
