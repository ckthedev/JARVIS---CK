import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { rescheduleMeetingSchema } from "@/lib/validations/meeting";

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
    const json = await req.json();
    const parsed = rescheduleMeetingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const meeting = await meetingService.rescheduleMeeting(
      session.user.id,
      id,
      parsed.data.startTime,
      parsed.data.endTime
    );

    return NextResponse.json({ meeting });
  } catch (error: unknown) {
    console.error("Failed to reschedule meeting:", error);
    const message = error instanceof Error ? error.message : "Failed to reschedule meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
