import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";
import { createNoteTagSchema } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await noteService.getTags(session.user.id);
    return NextResponse.json({ tags });
  } catch (error: unknown) {
    console.error("GET /api/notes/tags error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tags";
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
    const validated = createNoteTagSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const tag = await noteService.createTag(session.user.id, validated.data);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/notes/tags error:", error);
    const message = error instanceof Error ? error.message : "Failed to create tag";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
