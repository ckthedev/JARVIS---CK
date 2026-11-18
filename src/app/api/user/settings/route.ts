import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { updateReminderSettingsSchema } from "@/lib/validations/reminder";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          timezone: "Asia/Kolkata",
          soundEnabled: true,
          soundTheme: "subtle",
          defaultSnoozeMinutes: 10,
          missedReminderPolicy: "NOTIFY_IMMEDIATELY",
          notificationBrowser: true,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error("Failed to fetch user settings:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch user settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = updateReminderSettingsSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: {
        userId: session.user.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error("Failed to update user settings:", error);
    const message = error instanceof Error ? error.message : "Failed to update user settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
