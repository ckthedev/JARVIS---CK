import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { taskService } from "@/modules/tasks/service";
import { createTaskSchema } from "@/lib/validations/task";
import { TaskFilters, TaskStatus, TaskPriority, TaskViewTab } from "@/modules/tasks/types";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const filters: TaskFilters = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as TaskStatus) || undefined,
      priority: (searchParams.get("priority") as TaskPriority) || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      view: (searchParams.get("view") as TaskViewTab) || undefined,
      sortBy: (searchParams.get("sortBy") as TaskFilters["sortBy"]) || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const tasks = await taskService.getTasks(session.user.id, filters);
    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    console.error("[GET_TASKS_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to retrieve tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const task = await taskService.createTask(session.user.id, result.data);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
