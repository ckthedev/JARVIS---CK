import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";
import { attachNoteFileSchema } from "@/lib/validations/file";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "noteId query parameter is required" }, { status: 400 });
    }

    const attachments = await fileService.getNoteAttachments(session.user.id, noteId);
    return NextResponse.json({ attachments });
  } catch (error: unknown) {
    console.error("GET /api/files/attachments error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch note attachments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = attachNoteFileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const attachment = await fileService.attachFileToNote(
      session.user.id,
      validated.data.noteId,
      validated.data.fileId
    );

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/files/attachments error:", error);
    const message = error instanceof Error ? error.message : "Failed to attach file";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = attachNoteFileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await fileService.detachFileFromNote(
      session.user.id,
      validated.data.noteId,
      validated.data.fileId
    );

    return NextResponse.json({ success: true, message: "Attachment removed from note" });
  } catch (error: unknown) {
    console.error("DELETE /api/files/attachments error:", error);
    const message = error instanceof Error ? error.message : "Failed to detach file";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
