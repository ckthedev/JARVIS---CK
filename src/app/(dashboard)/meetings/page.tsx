import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { MeetingsManager } from "@/modules/meetings/components/meetings-manager";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Manager"
        description="Comprehensive calendar synchronization, agenda tracking, attendee coordination, and automated reminders."
      />

      <MeetingsManager />
    </div>
  );
}
