import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { taskService } from "@/modules/tasks/service";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireAuth();
  const [stats, recentTasks] = await Promise.all([
    taskService.getSummaryStats(user.id),
    taskService.getRecentTasks(user.id, 10),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Manager"
        description="Organize, prioritize, and track your projects and daily execution items."
      >
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" />
          Create Task (Phase 2)
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={CheckSquare}
          badge={{ text: "All", variant: "default" }}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          badge={{ text: "Active", variant: "secondary" }}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckSquare}
          badge={{ text: "Done", variant: "success" }}
        />
        <StatCard
          title="Urgent"
          value={stats.urgent}
          icon={AlertCircle}
          badge={{ text: stats.urgent > 0 ? "Urgent" : "Zero", variant: "destructive" }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Active Tasks
          </CardTitle>
          <CardDescription>
            Database models and service layers are initialized. Full task management UI will be deployed in the Task Manager phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks currently registered"
              description="Your PostgreSQL database is connected and ready. The task management engine will be integrated in Phase 2."
            />
          ) : (
            <div className="divide-y divide-border/40">
              {recentTasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{task.title}</span>
                  <span className="text-xs text-secondary-text">{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
