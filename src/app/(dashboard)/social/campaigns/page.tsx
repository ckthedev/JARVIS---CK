import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { SocialNav } from "@/modules/social/components/social-nav";
import { CampaignManager } from "@/modules/social/components/campaign-manager";

export const dynamic = "force-dynamic";

export default async function CampaignsRoute() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Media Campaigns"
        description="Organize themed initiatives, product launches, seasonal pushes, and track multi-channel status distributions."
      />

      <SocialNav />
      <CampaignManager />
    </div>
  );
}
