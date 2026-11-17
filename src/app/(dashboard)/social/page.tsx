import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { socialService } from "@/modules/social/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const user = await requireAuth();
  const [scheduledPosts, accounts] = await Promise.all([
    socialService.getScheduledPosts(user.id),
    socialService.getConnectedAccounts(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Media Manager"
        description="Unified social communications, multi-channel scheduling, and asset preparation."
      >
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" />
          Schedule Post (Phase 3)
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Connected Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-secondary-text mt-1">
              Twitter, LinkedIn, YouTube, Instagram
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Queued Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts.length}</div>
            <p className="text-xs text-secondary-text mt-1">
              Posts waiting for publishing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Engine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Radio className="h-4 w-4 animate-pulse" />
              <span>Standby</span>
            </div>
            <p className="text-xs text-secondary-text mt-1">
              Awaiting Social Media Manager phase
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Social Publication Schedule
          </CardTitle>
          <CardDescription>
            Database schemas for accounts, posts, and media assets are in place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Share2}
            title="No scheduled social activity"
            description="Multi-platform publishing, drafts, and automated schedule workflows will be implemented in the Social Media phase."
          />
        </CardContent>
      </Card>
    </div>
  );
}
