import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";
import { bulkFileActionSchema } from "@/lib/validations/file";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = bulkFileActionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await fileService.bulkAction(session.user.id, validated.data);
    return NextResponse.json({ success: true, count: result.count });
  } catch (error: unknown) {
    console.error("POST /api/files/bulk error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute bulk action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
