import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { createPillarSchema } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  try {
    const pillars = await socialService.getPillars(session.user.id, includeArchived);
    return NextResponse.json({ pillars });
  } catch (error: unknown) {
    console.error("Failed to fetch pillars:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch pillars";
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
    const parsed = createPillarSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const pillar = await socialService.createPillar(session.user.id, parsed.data);
    return NextResponse.json({ pillar }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create pillar:", error);
    const message = error instanceof Error ? error.message : "Failed to create pillar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
