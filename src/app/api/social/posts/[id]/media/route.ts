import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { postMediaInputSchema } from "@/lib/validations/social";

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
    const parsed = postMediaInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const media = await socialService.attachMedia(
      session.user.id,
      id,
      parsed.data.fileId,
      parsed.data.displayOrder,
      parsed.data.caption || undefined
    );

    return NextResponse.json({ media }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to attach media:", error);
    const message = error instanceof Error ? error.message : "Failed to attach media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "fileId query parameter is required" }, { status: 400 });
  }

  try {
    await socialService.detachMedia(session.user.id, id, fileId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to detach media:", error);
    const message = error instanceof Error ? error.message : "Failed to detach media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
