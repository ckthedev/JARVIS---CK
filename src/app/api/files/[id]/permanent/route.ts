import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";

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
    await fileService.permanentlyDeleteFile(session.user.id, id);

    return NextResponse.json({ success: true, message: "File permanently deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/files/[id]/permanent error:", error);
    const message = error instanceof Error ? error.message : "Failed to permanently delete file";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
