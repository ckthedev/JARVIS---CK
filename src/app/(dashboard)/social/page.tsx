import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { SocialDashboard } from "@/modules/social/components/social-dashboard";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Media Manager"
        description="Plan multi-platform social content, create drafts, manage campaigns & hashtags, schedule releases, and track publishing workflow."
      />

      <SocialDashboard />
    </div>
  );
}
