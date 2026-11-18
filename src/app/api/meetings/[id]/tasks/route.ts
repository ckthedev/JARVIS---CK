import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { meetingTaskSchema } from "@/lib/validations/meeting";

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
    const parsed = meetingTaskSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const task = await meetingService.createFollowUpTask(session.user.id, id, parsed.data);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create follow-up task:", error);
    const message = error instanceof Error ? error.message : "Failed to create follow-up task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
