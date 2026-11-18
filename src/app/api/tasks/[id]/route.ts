import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { taskService } from "@/modules/tasks/service";
import { updateTaskSchema } from "@/lib/validations/task";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const task = await taskService.getTaskById(session.user.id, id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err: unknown) {
    console.error("[GET_TASK_BY_ID_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to retrieve task" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedTask = await taskService.updateTask(
      session.user.id,
      id,
      result.data
    );

    return NextResponse.json({ task: updatedTask });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await taskService.deleteTask(session.user.id, id);

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete task";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
