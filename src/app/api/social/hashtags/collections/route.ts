import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { createHashtagCollectionSchema } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collections = await socialService.getHashtagCollections(session.user.id);
    return NextResponse.json({ collections });
  } catch (error: unknown) {
    console.error("Failed to fetch hashtag collections:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch hashtag collections";
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
    const parsed = createHashtagCollectionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const collection = await socialService.createHashtagCollection(session.user.id, parsed.data);
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create hashtag collection:", error);
    const message = error instanceof Error ? error.message : "Failed to create hashtag collection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
