import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { reminderService } from "@/modules/reminders/service";
import { createReminderSchema } from "@/lib/validations/reminder";
import { ReminderPriority, ReminderStatus, ReminderSection } from "@/modules/reminders/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const section = (searchParams.get("section") as ReminderSection) || "all";
  const search = searchParams.get("search") || undefined;
  const priority = (searchParams.get("priority") as ReminderPriority) || undefined;
  const status = (searchParams.get("status") as ReminderStatus) || undefined;
  const isRecurringParam = searchParams.get("isRecurring");
  const isRecurring = isRecurringParam !== null ? isRecurringParam === "true" : undefined;
  const taskId = searchParams.get("taskId") || undefined;
  const meetingId = searchParams.get("meetingId") || undefined;
  const sortBy = (searchParams.get("sortBy") as "dueAt" | "priority" | "createdAt" | "title") || "dueAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined;

  try {
    const reminders = await reminderService.getReminders(session.user.id, {
      section,
      search,
      priority,
      status,
      isRecurring,
      taskId,
      meetingId,
      sortBy,
      sortOrder,
      limit,
      page,
    });

    return NextResponse.json({ reminders });
  } catch (error: unknown) {
    console.error("Failed to fetch reminders:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch reminders";
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
    const parsed = createReminderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reminder = await reminderService.createReminder(session.user.id, parsed.data);
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create reminder:", error);
    const message = error instanceof Error ? error.message : "Failed to create reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
