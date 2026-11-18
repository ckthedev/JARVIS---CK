import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { meetingService } from "@/modules/meetings/service";
import { agendaItemSchema } from "@/lib/validations/meeting";

export const dynamic = "force-dynamic";

export async function POST(
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
    const parsed = agendaItemSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const item = await meetingService.addAgendaItem(session.user.id, id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to add agenda item:", error);
    const message = error instanceof Error ? error.message : "Failed to add agenda item";
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

    // Check if reordering
    if (json.itemIds && Array.isArray(json.itemIds)) {
      const items = await meetingService.reorderAgendaItems(session.user.id, id, json.itemIds);
      return NextResponse.json({ items });
    }

    const { itemId, ...data } = json;
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const item = await meetingService.updateAgendaItem(session.user.id, id, itemId, data);
    return NextResponse.json({ item });
  } catch (error: unknown) {
    console.error("Failed to update agenda item:", error);
    const message = error instanceof Error ? error.message : "Failed to update agenda item";
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
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    await meetingService.deleteAgendaItem(session.user.id, id, itemId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete agenda item:", error);
    const message = error instanceof Error ? error.message : "Failed to delete agenda item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
