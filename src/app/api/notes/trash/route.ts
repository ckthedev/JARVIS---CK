import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await noteService.emptyTrash(session.user.id);
    return NextResponse.json({ success: true, count, message: `${count} notes permanently deleted` });
  } catch (error: unknown) {
    console.error("DELETE /api/notes/trash error:", error);
    const message = error instanceof Error ? error.message : "Failed to empty trash";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
