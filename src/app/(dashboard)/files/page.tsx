import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { fileService } from "@/modules/files/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Upload, HardDrive, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const user = await requireAuth();
  const [recentFiles, usage] = await Promise.all([
    fileService.getRecentFiles(user.id),
    fileService.getTotalStorageUsage(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="File Manager"
        description="Private local asset repository with path traversal protection and database metadata."
      >
        <Button size="sm" className="gap-1.5" disabled>
          <Upload className="h-4 w-4" />
          Upload Files (Phase 7)
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Total Files Stored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalFiles}</div>
            <p className="text-xs text-secondary-text mt-1">Indexed in PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Local Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(usage.totalBytes)}</div>
            <p className="text-xs text-secondary-text mt-1">Stored securely outside public directory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Storage Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <HardDrive className="h-4 w-4" />
              <span>Local Filesystem</span>
            </div>
            <p className="text-xs text-secondary-text mt-1">
              data/uploads/ with UUID abstraction
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Storage Security Layer
          </CardTitle>
          <CardDescription>
            The LocalStorageProvider abstraction has been implemented with path traversal prevention and unique hash naming.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentFiles.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No files uploaded yet"
              description="Drag-and-drop file ingestion, directory trees, and preview capabilities will be activated in Phase 7."
            />
          ) : (
            <div className="divide-y divide-border/40">
              {recentFiles.map((f) => (
                <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{f.originalName}</span>
                  <span className="text-secondary-text">{formatBytes(f.sizeBytes)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
