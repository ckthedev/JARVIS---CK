import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { RemindersManager } from "@/modules/reminders/components/reminders-manager";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders & Notifications"
        description="Time-sensitive alerts, recurring schedules, and automated notification triggers."
      />

      <RemindersManager />
    </div>
  );
}
