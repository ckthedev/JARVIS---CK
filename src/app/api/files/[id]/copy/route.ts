import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let targetFolderId: string | null | undefined = undefined;

    try {
      const body = await req.json();
      if (body && typeof body.folderId !== "undefined") {
        targetFolderId = body.folderId;
      }
    } catch {
      // Body is optional
    }

    const file = await fileService.copyFile(session.user.id, id, targetFolderId);
    return NextResponse.json({ file, message: "File copied successfully" }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/files/[id]/copy error:", error);
    const message = error instanceof Error ? error.message : "Failed to copy file";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
