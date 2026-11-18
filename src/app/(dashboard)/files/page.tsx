import React, { Suspense } from "react";
import { requireAuth } from "@/lib/auth/session";
import { FilesManager } from "@/modules/files/components/files-manager";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  await requireAuth();

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center text-sm text-secondary-text">
          Loading File Manager...
        </div>
      }
    >
      <div className="rounded-xl border border-border bg-[#0D1421] overflow-hidden h-[calc(100vh-10rem)] shadow-xl flex flex-col">
        <FilesManager />
      </div>
    </Suspense>
  );
}
