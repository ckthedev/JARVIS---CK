import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { createHashtagSchema } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;

  try {
    const hashtags = await socialService.getHashtags(session.user.id, search, category);
    return NextResponse.json({ hashtags });
  } catch (error: unknown) {
    console.error("Failed to fetch hashtags:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch hashtags";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createHashtagSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const hashtag = await socialService.createHashtag(session.user.id, parsed.data);
    return NextResponse.json({ hashtag }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create hashtag:", error);
    const message = error instanceof Error ? error.message : "Failed to create hashtag";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
