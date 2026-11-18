import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        userId: session.user.id,
        status: { not: "CANCELLED" },
      },
      orderBy: { startTime: "asc" },
      take: 50,
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        location: true,
        status: true,
      },
    });

    return NextResponse.json({ meetings });
  } catch (error: unknown) {
    console.error("Failed to fetch meetings:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch meetings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
