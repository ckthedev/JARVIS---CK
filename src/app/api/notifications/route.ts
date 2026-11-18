import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { notificationService } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 30;
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const [items, unreadCount] = await Promise.all([
    notificationService.listForUser(session.user.id, {
      limit,
      type,
      isRead: unreadOnly ? false : undefined,
    }),
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

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const clearAll = searchParams.get("clearAll") === "true";

  if (clearAll) {
    await notificationService.clearAll(session.user.id);
    return NextResponse.json({ success: true });
  }

  if (id) {
    const success = await notificationService.deleteNotification(id, session.user.id);
    return NextResponse.json({ success });
  }

  return NextResponse.json({ error: "id or clearAll required" }, { status: 400 });
}
