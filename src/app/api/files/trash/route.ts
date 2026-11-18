import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await fileService.emptyTrash(session.user.id);
    return NextResponse.json({
      success: true,
      message: `Trash emptied (${result.filesCount} files, ${result.foldersCount} folders removed)`,
      filesCount: result.filesCount,
      foldersCount: result.foldersCount,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/files/trash error:", error);
    const message = error instanceof Error ? error.message : "Failed to empty trash";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
