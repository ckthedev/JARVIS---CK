import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { meetingService } from "@/modules/meetings/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const user = await requireAuth();
  const [meetings, todayCount] = await Promise.all([
    meetingService.getUpcomingMeetings(user.id),
    meetingService.getTodayMeetingCount(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Manager"
        description="Comprehensive calendar synchronization, agenda tracking, and attendee coordination."
      >
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" />
          Schedule Meeting (Phase 5)
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Meetings Scheduled Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-secondary-text mt-1">Calendar events for the current day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Upcoming In Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-secondary-text mt-1">Future confirmed meetings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Scheduled Meetings
          </CardTitle>
          <CardDescription>
            Database schemas for meetings and attendee tracking are initialized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="No meetings currently scheduled"
            description="Integration with external calendars and custom agenda notes will be implemented in the Meeting Manager phase."
          />
        </CardContent>
      </Card>
    </div>
  );
}
