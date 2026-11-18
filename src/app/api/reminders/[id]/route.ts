import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { reminderService } from "@/modules/reminders/service";
import { updateReminderSchema } from "@/lib/validations/reminder";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reminder = await reminderService.getReminderById(session.user.id, id);
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }
    return NextResponse.json({ reminder });
  } catch (error: unknown) {
    console.error("Failed to get reminder:", error);
    const message = error instanceof Error ? error.message : "Failed to get reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const parsed = updateReminderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reminder = await reminderService.updateReminder(session.user.id, id, parsed.data);
    return NextResponse.json({ reminder });
  } catch (error: unknown) {
    console.error("Failed to update reminder:", error);
    const message = error instanceof Error ? error.message : "Failed to update reminder";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  try {
    const success = await reminderService.deleteReminder(session.user.id, id, permanent);
    return NextResponse.json({ success });
  } catch (error: unknown) {
    console.error("Failed to delete reminder:", error);
    const message = error instanceof Error ? error.message : "Failed to delete reminder";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
