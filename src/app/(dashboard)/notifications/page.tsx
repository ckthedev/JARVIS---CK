import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsCenter } from "./notifications-center";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications Center"
        description="Unified activity stream, system alerts, scheduled reminder triggers, and calendar events."
      />

      <NotificationsCenter />
    </div>
  );
}
