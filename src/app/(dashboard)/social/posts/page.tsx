import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { PostsManager } from "@/modules/social/components/posts-manager";

export const dynamic = "force-dynamic";

export default async function PostsRoute() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Posts & Drafts"
        description="Write platform-specific captions, attach creatives from File Manager, and organize content workflow from idea to publishing."
      />

      <PostsManager />
    </div>
  );
}
