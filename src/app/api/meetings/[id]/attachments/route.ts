import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";

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
    const { fileId } = json;

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const attachment = await meetingService.attachFile(session.user.id, id, fileId);
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to attach file:", error);
    const message = error instanceof Error ? error.message : "Failed to attach file";
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
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    await meetingService.detachFile(session.user.id, id, fileId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to detach file:", error);
    const message = error instanceof Error ? error.message : "Failed to detach file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
