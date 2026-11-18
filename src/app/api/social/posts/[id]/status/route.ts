import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { statusTransitionSchema } from "@/lib/validations/social";

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
    const json = await req.json();
    const parsed = statusTransitionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const post = await socialService.transitionPostStatus(
      session.user.id,
      id,
      parsed.data.status,
      parsed.data.notes
    );

    return NextResponse.json({ post });
  } catch (error: unknown) {
    console.error("Failed to transition post status:", error);
    const message = error instanceof Error ? error.message : "Failed to transition post status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
