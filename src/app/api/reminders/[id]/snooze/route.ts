import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { reminderService } from "@/modules/reminders/service";
import { snoozeReminderSchema } from "@/lib/validations/reminder";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = snoozeReminderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reminder = await reminderService.snoozeReminder(session.user.id, id, parsed.data);
    return NextResponse.json({ reminder });
  } catch (error: unknown) {
    console.error("Failed to snooze reminder:", error);
    const message = error instanceof Error ? error.message : "Failed to snooze reminder";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
