import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { reminderService } from "@/modules/reminders/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await reminderService.getReminderStats(session.user.id);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error("Failed to fetch reminder stats:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
