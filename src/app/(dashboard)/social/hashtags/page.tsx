import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { SocialNav } from "@/modules/social/components/social-nav";
import { HashtagManager } from "@/modules/social/components/hashtag-manager";

export const dynamic = "force-dynamic";

export default async function HashtagsRoute() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hashtag Library & Collections"
        description="Organize reusable hashtag sets and collections with 1-click clipboard copying and post insertion."
      />

      <SocialNav />
      <HashtagManager />
    </div>
  );
}
