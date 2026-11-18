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
    const processedCount = await schedulerEngine.checkDueReminders();
    return NextResponse.json({ success: true, processedCount });
  } catch (error: unknown) {
    console.error("Failed to process due reminders:", error);
    const message = error instanceof Error ? error.message : "Failed to process due reminders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
