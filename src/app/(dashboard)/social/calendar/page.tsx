import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { SocialCalendarPage } from "@/modules/social/components/social-calendar-page";

export const dynamic = "force-dynamic";

export default async function CalendarRoute() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Content Calendar"
        description="Month, week, day, and agenda views of your planned social publishing schedule with Asia/Kolkata timezone support."
      />

      <SocialCalendarPage />
    </div>
  );
}
