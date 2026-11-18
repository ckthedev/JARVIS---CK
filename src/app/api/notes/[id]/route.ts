import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";
import { updateNoteSchema } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const note = await noteService.getNoteById(session.user.id, id);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error: unknown) {
    console.error("GET /api/notes/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateNoteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const note = await noteService.updateNote(session.user.id, id, validated.data);
    return NextResponse.json({ note });
  } catch (error: unknown) {
    console.error("PATCH /api/notes/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update note";
    const status = message.includes("unauthorized") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await noteService.softDeleteNote(session.user.id, id);
    return NextResponse.json({ success: true, message: "Note moved to trash" });
  } catch (error: unknown) {
    console.error("DELETE /api/notes/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete note";
    const status = message.includes("unauthorized") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
