import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { createMeetingSchema } from "@/lib/validations/meeting";
import {
  MeetingSection,
  MeetingStatus,
  MeetingType,
  MeetingPriority,
} from "@/modules/meetings/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const section = (searchParams.get("section") as MeetingSection) || "all";
  const search = searchParams.get("search") || undefined;
  const status = (searchParams.get("status") as MeetingStatus) || undefined;
  const meetingType = (searchParams.get("meetingType") as MeetingType) || undefined;
  const priority = (searchParams.get("priority") as MeetingPriority) || undefined;
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const participant = searchParams.get("participant") || undefined;
  const sortBy = (searchParams.get("sortBy") as "startTime" | "title" | "priority" | "createdAt") || "startTime";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  try {
    const meetings = await meetingService.getMeetings(session.user.id, {
      section,
      search,
      status,
      meetingType,
      priority,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      participant,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({ meetings });
  } catch (error: unknown) {
    console.error("Failed to fetch meetings:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch meetings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createMeetingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const meeting = await meetingService.createMeeting(session.user.id, parsed.data);
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create meeting:", error);
    const message = error instanceof Error ? error.message : "Failed to create meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
