import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { createSocialPostSchema } from "@/lib/validations/social";
import {
  SocialPostStatus,
  SocialPlatform,
  SocialPostPriority,
} from "@/modules/social/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") as SocialPostStatus | "OVERDUE" | "ALL") || undefined;
  const platform = (searchParams.get("platform") as SocialPlatform) || undefined;
  const campaignId = searchParams.get("campaignId") || undefined;
  const contentPillarId = searchParams.get("contentPillarId") || undefined;
  const priority = (searchParams.get("priority") as SocialPostPriority) || undefined;
  const search = searchParams.get("search") || undefined;
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const sortBy = (searchParams.get("sortBy") as "plannedAt" | "createdAt" | "priority") || "plannedAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined;

  try {
    const posts = await socialService.getPosts(session.user.id, {
      status,
      platform,
      campaignId,
      contentPillarId,
      priority,
      search,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      sortBy,
      sortOrder,
      limit,
      page,
    });

    return NextResponse.json({ posts });
  } catch (error: unknown) {
    console.error("Failed to fetch social posts:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch social posts";
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
    const parsed = createSocialPostSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const post = await socialService.createPost(session.user.id, parsed.data);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create social post:", error);
    const message = error instanceof Error ? error.message : "Failed to create social post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
