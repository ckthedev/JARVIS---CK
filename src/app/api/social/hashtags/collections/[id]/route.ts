import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { updateHashtagCollectionSchema } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const parsed = updateHashtagCollectionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const collection = await socialService.updateHashtagCollection(session.user.id, id, parsed.data);
    return NextResponse.json({ collection });
  } catch (error: unknown) {
    console.error("Failed to update hashtag collection:", error);
    const message = error instanceof Error ? error.message : "Failed to update hashtag collection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await socialService.deleteHashtagCollection(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete hashtag collection:", error);
    const message = error instanceof Error ? error.message : "Failed to delete hashtag collection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
