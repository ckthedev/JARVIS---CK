import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { socialService } from "@/modules/social/service";
import { updatePillarSchema } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const parsed = updatePillarSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const pillar = await socialService.updatePillar(session.user.id, id, parsed.data);
    return NextResponse.json({ pillar });
  } catch (error: unknown) {
    console.error("Failed to update pillar:", error);
    const message = error instanceof Error ? error.message : "Failed to update pillar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await socialService.deletePillar(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete pillar:", error);
    const message = error instanceof Error ? error.message : "Failed to delete pillar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
