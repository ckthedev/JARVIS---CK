import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { createCampaignSchema } from "@/lib/validations/social";
import { CampaignStatus } from "@/modules/social/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") as CampaignStatus) || undefined;

  try {
    const campaigns = await socialService.getCampaigns(session.user.id, status);
    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    console.error("Failed to fetch campaigns:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch campaigns";
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
    const parsed = createCampaignSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const campaign = await socialService.createCampaign(session.user.id, parsed.data);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create campaign:", error);
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
