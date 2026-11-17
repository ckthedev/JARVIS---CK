import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { reminderService } from "@/modules/reminders/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const user = await requireAuth();
  const [reminders, pendingCount] = await Promise.all([
    reminderService.getUpcomingReminders(user.id),
    reminderService.getPendingCount(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders & Notifications"
        description="Time-sensitive alerts, follow-ups, and automated notification triggers."
      >
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" />
          Add Reminder (Phase 4)
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Active Alert Registry
          </CardTitle>
          <CardDescription>
            Real-time reminder triggers and notifications engine will be fully enabled in Phase 4.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Zero pending reminders"
              description="Your reminder schedule is clean. Database models are primed for custom frequencies and sound alerts."
            />
          ) : (
            <div className="text-sm">Total pending: {pendingCount}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
