import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { notificationService } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    notificationService.listForUser(session.user.id, 10),
    notificationService.getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, markAll } = body as { id?: string; markAll?: boolean };

  if (markAll) {
    await notificationService.markAllAsRead(session.user.id);
    return NextResponse.json({ success: true });
  }

  if (id) {
    await notificationService.markAsRead(id, session.user.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
