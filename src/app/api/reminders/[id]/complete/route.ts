import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { reminderService } from "@/modules/reminders/service";

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
    const reminder = await reminderService.completeReminder(session.user.id, id);
    return NextResponse.json({ reminder });
  } catch (error: unknown) {
    console.error("Failed to complete reminder:", error);
    const message = error instanceof Error ? error.message : "Failed to complete reminder";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
