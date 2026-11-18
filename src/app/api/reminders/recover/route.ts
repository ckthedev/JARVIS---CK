import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { schedulerEngine } from "@/modules/reminders/scheduler/engine";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recoveredCount = await schedulerEngine.recoverMissedReminders();
    return NextResponse.json({ success: true, recoveredCount });
  } catch (error: unknown) {
    console.error("Failed to recover missed reminders:", error);
    const message = error instanceof Error ? error.message : "Failed to recover missed reminders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
