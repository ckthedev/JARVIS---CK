import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const note = await noteService.togglePin(session.user.id, id);
    return NextResponse.json({ note, isPinned: note.isPinned });
  } catch (error: unknown) {
    console.error("POST /api/notes/[id]/pin error:", error);
    const message = error instanceof Error ? error.message : "Failed to toggle pin";
    return NextResponse.json(
      { error: message },
      { status: message.includes("unauthorized") ? 404 : 500 }
    );
  }
}
