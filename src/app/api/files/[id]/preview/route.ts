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

    let contentType = download.mimeType || "application/octet-stream";
    // Never serve HTML directly as text/html to prevent XSS in same-origin preview
    if (contentType === "text/html") {
      contentType = "text/plain; charset=utf-8";
    }

    // Prepare CSP header to isolate preview
    const csp =
      download.mimeType === "image/svg+xml"
        ? "default-src 'none'; style-src 'unsafe-inline'; sandbox"
        : "default-src 'none'; style-src 'unsafe-inline'; media-src 'self' blob:; img-src 'self' blob: data:; font-src 'self' data:; sandbox";

    return new NextResponse(new Uint8Array(download.buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": download.buffer.length.toString(),
        "Content-Disposition": `inline; filename="${download.filename.replace(/"/g, '\\"')}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": csp,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/files/[id]/preview error:", error);
    const message = error instanceof Error ? error.message : "Failed to load file preview";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
