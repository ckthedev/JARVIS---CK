import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";

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
    const download = await fileService.downloadFile(session.user.id, id);

    // Encode filename safely for Content-Disposition (RFC 5987 / RFC 6266)
    const encodedFilename = encodeURIComponent(download.filename).replace(/['()]/g, escape);

    return new NextResponse(new Uint8Array(download.buffer), {
      status: 200,
      headers: {
        "Content-Type": download.mimeType || "application/octet-stream",
        "Content-Length": download.buffer.length.toString(),
        "Content-Disposition": `attachment; filename="${download.filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedFilename}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/files/[id]/download error:", error);
    const message = error instanceof Error ? error.message : "Failed to download file";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
