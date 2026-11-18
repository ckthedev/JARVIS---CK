import React, { Suspense } from "react";
import { requireAuth } from "@/lib/auth/session";
import { taskService } from "@/modules/tasks/service";
import { TaskManager } from "@/modules/tasks/components/task-manager";
import { LoadingCard } from "@/components/shared/loading-card";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireAuth();

  const [categories, projects] = await Promise.all([
    taskService.getCategories(user.id),
    taskService.getProjects(user.id),
  ]);

  return (
    <Suspense fallback={<LoadingCard />}>
      <TaskManager
        initialCategories={categories}
        initialProjects={projects}
      />
    </Suspense>
  );
}
