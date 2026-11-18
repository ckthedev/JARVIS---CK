import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";
import { updateFolderSchema, deleteFolderSchema } from "@/lib/validations/file";

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
    const folder = await fileService.getFolderById(session.user.id, id);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const breadcrumbs = await fileService.getFolderBreadcrumbs(session.user.id, id);

    return NextResponse.json({ folder, breadcrumbs });
  } catch (error: unknown) {
    console.error("GET /api/files/folders/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateFolderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const folder = await fileService.updateFolder(session.user.id, id, validated.data);
    return NextResponse.json({ folder });
  } catch (error: unknown) {
    console.error("PATCH /api/files/folders/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update folder";
    const status =
      message.includes("not found") || message.includes("unauthorized")
        ? 404
        : message.includes("already exists") || message.includes("Cannot move")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    let action = searchParams.get("action") || "move_to_parent";

    try {
      const body = await req.json();
      if (body?.action) {
        action = body.action;
      }
    } catch {
      // Body is optional if query param provided
    }

    const validated = deleteFolderSchema.safeParse({ action });
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await fileService.deleteFolder(session.user.id, id, validated.data);
    return NextResponse.json({ success: true, message: "Folder deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/files/folders/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete folder";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
