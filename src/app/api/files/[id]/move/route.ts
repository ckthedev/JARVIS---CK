import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";
import { moveFileSchema } from "@/lib/validations/file";

export const dynamic = "force-dynamic";

export async function POST(
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
    const validated = moveFileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const file = await fileService.moveFile(session.user.id, id, validated.data);
    return NextResponse.json({ file, message: "File moved successfully" });
  } catch (error: unknown) {
    console.error("POST /api/files/[id]/move error:", error);
    const message = error instanceof Error ? error.message : "Failed to move file";
    const status = message.includes("not found") || message.includes("unauthorized") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
