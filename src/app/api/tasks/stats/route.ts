import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { taskService } from "@/modules/tasks/service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await taskService.getDashboardTaskStats(session.user.id);
    return NextResponse.json({ stats });
  } catch (err: unknown) {
    console.error("[GET_TASK_STATS_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to retrieve task statistics" },
      { status: 500 }
    );
  }
}
