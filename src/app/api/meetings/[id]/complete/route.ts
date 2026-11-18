import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let actualEndTime: string | undefined;
    try {
      const json = await req.json();
      actualEndTime = json.actualEndTime;
    } catch {
      // Body is optional
    }

    const meeting = await meetingService.completeMeeting(session.user.id, id, actualEndTime);
    return NextResponse.json({ meeting });
  } catch (error: unknown) {
    console.error("Failed to complete meeting:", error);
    const message = error instanceof Error ? error.message : "Failed to complete meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
