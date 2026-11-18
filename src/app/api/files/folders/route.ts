import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";
import { createFolderSchema } from "@/lib/validations/file";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const parentId = searchParams.get("parentId") || null;

    const folders = all
      ? await fileService.getAllFolders(session.user.id)
      : await fileService.getFolders(session.user.id, parentId);

    return NextResponse.json({ folders });
  } catch (error: unknown) {
    console.error("GET /api/files/folders error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createFolderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const folder = await fileService.createFolder(session.user.id, validated.data);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/files/folders error:", error);
    const message = error instanceof Error ? error.message : "Failed to create folder";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
