import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await fileService.getStorageOverview(session.user.id);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error("GET /api/files/stats error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch storage stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
