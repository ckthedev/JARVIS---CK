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
    const note = await noteService.toggleArchive(session.user.id, id);
    return NextResponse.json({ note, isArchived: note.isArchived });
  } catch (error: unknown) {
    console.error("POST /api/notes/[id]/archive error:", error);
    const message = error instanceof Error ? error.message : "Failed to toggle archive";
    return NextResponse.json(
      { error: message },
      { status: message.includes("unauthorized") ? 404 : 500 }
    );
  }
}
