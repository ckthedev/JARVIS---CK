import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { updateCampaignSchema } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const campaign = await socialService.getCampaignById(session.user.id, id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    console.error("Failed to fetch campaign:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const parsed = updateCampaignSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const campaign = await socialService.updateCampaign(session.user.id, id, parsed.data);
    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    console.error("Failed to update campaign:", error);
    const message = error instanceof Error ? error.message : "Failed to update campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await socialService.deleteCampaign(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete campaign:", error);
    const message = error instanceof Error ? error.message : "Failed to delete campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
