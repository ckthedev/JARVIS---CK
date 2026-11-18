import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await socialService.getSocialStats(session.user.id);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error("Failed to fetch social stats:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch social stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
