import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { SocialPlatform, SocialPostStatus } from "@/modules/social/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();

  // Default to 1 month before and 2 months after current date if not specified
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const startDate = startParam
    ? new Date(startParam)
    : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = endParam
    ? new Date(endParam)
    : new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

  const platform = (searchParams.get("platform") as SocialPlatform) || undefined;
  const campaignId = searchParams.get("campaignId") || undefined;
  const status = (searchParams.get("status") as SocialPostStatus) || undefined;

  try {
    const posts = await socialService.getCalendarPosts(
      session.user.id,
      startDate,
      endDate,
      platform,
      campaignId,
      status
    );
    return NextResponse.json({ posts });
  } catch (error: unknown) {
    console.error("Failed to fetch calendar posts:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch calendar posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
