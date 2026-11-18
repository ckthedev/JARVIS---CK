import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const post = await socialService.duplicatePost(session.user.id, id);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to duplicate post:", error);
    const message = error instanceof Error ? error.message : "Failed to duplicate post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
