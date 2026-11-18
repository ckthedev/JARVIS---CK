import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "Query parameters 'start' and 'end' are required" },
      { status: 400 }
    );
  }

  try {
    const meetings = await meetingService.getCalendarMeetings(session.user.id, start, end);
    return NextResponse.json({ meetings });
  } catch (error: unknown) {
    console.error("Failed to fetch calendar meetings:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch calendar meetings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
