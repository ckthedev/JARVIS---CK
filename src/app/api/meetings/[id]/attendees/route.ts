import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { attendeeSchema } from "@/lib/validations/meeting";

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
    const parsed = attendeeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const attendee = await meetingService.addAttendee(session.user.id, id, parsed.data);
    return NextResponse.json({ attendee }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to add attendee:", error);
    const message = error instanceof Error ? error.message : "Failed to add attendee";
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
    const { attendeeId, ...data } = json;

    if (!attendeeId) {
      return NextResponse.json({ error: "attendeeId is required" }, { status: 400 });
    }

    const attendee = await meetingService.updateAttendee(session.user.id, id, attendeeId, data);
    return NextResponse.json({ attendee });
  } catch (error: unknown) {
    console.error("Failed to update attendee:", error);
    const message = error instanceof Error ? error.message : "Failed to update attendee";
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
  const attendeeId = searchParams.get("attendeeId");

  if (!attendeeId) {
    return NextResponse.json({ error: "attendeeId is required" }, { status: 400 });
  }

  try {
    await meetingService.removeAttendee(session.user.id, id, attendeeId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to remove attendee:", error);
    const message = error instanceof Error ? error.message : "Failed to remove attendee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
