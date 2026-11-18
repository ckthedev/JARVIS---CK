import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";
import { updateNoteTagSchema } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

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
    const validated = updateNoteTagSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const tag = await noteService.updateTag(session.user.id, id, validated.data);
    return NextResponse.json({ tag });
  } catch (error: unknown) {
    console.error("PATCH /api/notes/tags/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update tag";
    const status = message.includes("already exists")
      ? 409
      : message.includes("unauthorized") || message.includes("not found")
      ? 404
      : 500;
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
    await noteService.deleteTag(session.user.id, id);
    return NextResponse.json({ success: true, message: "Tag deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/notes/tags/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete tag";
    const status = message.includes("unauthorized") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
