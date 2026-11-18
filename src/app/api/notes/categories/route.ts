import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { noteService } from "@/modules/notes/service";
import { createNoteCategorySchema } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-seed default categories if user has none
    const categories = await noteService.seedDefaultCategories(session.user.id);
    return NextResponse.json({ categories });
  } catch (error: unknown) {
    console.error("GET /api/notes/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
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
    const validated = createNoteCategorySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const category = await noteService.createCategory(session.user.id, validated.data);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/notes/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to create category";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
