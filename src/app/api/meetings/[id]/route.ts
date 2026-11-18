import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { updateMeetingSchema } from "@/lib/validations/meeting";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const meeting = await meetingService.getMeetingById(session.user.id, id);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error: unknown) {
    console.error("Failed to fetch meeting:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
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
    const parsed = updateMeetingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const meeting = await meetingService.updateMeeting(session.user.id, id, parsed.data);
    return NextResponse.json({ meeting });
  } catch (error: unknown) {
    console.error("Failed to update meeting:", error);
    const message = error instanceof Error ? error.message : "Failed to update meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  try {
    await meetingService.deleteMeeting(session.user.id, id, permanent);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete meeting:", error);
    const message = error instanceof Error ? error.message : "Failed to delete meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
