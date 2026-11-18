import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { meetingNoteSchema } from "@/lib/validations/meeting";

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
    const parsed = meetingNoteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const noteLink = await meetingService.linkNote(session.user.id, id, parsed.data);
    return NextResponse.json({ noteLink });
  } catch (error: unknown) {
    console.error("Failed to link meeting note:", error);
    const message = error instanceof Error ? error.message : "Failed to link meeting note";
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
  const linkId = searchParams.get("linkId");

  if (!linkId) {
    return NextResponse.json({ error: "linkId is required" }, { status: 400 });
  }

  try {
    await meetingService.unlinkNote(session.user.id, id, linkId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to unlink note:", error);
    const message = error instanceof Error ? error.message : "Failed to unlink note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
