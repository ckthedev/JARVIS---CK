import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";
import { createNoteSchema } from "@/lib/validations/note";
import { NoteViewSection } from "@/modules/notes/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as NoteViewSection) || "all";
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") as "updatedAt" | "createdAt" | "title" | "oldest") || "updatedAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const notes = await noteService.getNotes(session.user.id, {
      section,
      categoryId,
      tagId,
      search,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({ notes });
  } catch (error: unknown) {
    console.error("GET /api/notes error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch notes";
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
    const validated = createNoteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const note = await noteService.createNote(session.user.id, validated.data);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/notes error:", error);
    const message = error instanceof Error ? error.message : "Failed to create note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
