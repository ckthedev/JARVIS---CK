import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";

export const dynamic = "force-dynamic";

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
    await noteService.permanentlyDeleteNote(session.user.id, id);
    return NextResponse.json({ success: true, message: "Note permanently deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/notes/[id]/permanent error:", error);
    const message = error instanceof Error ? error.message : "Failed to permanently delete note";
    return NextResponse.json(
      { error: message },
      { status: message.includes("unauthorized") ? 404 : 500 }
    );
  }
}
