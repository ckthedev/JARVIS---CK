import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await meetingService.getMeetingStats(session.user.id);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error("Failed to fetch meeting stats:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch meeting stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
