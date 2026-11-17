import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { noteService } from "@/modules/notes/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const user = await requireAuth();
  const [notes, totalCount] = await Promise.all([
    noteService.getRecentNotes(user.id),
    noteService.getTotalCount(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes Manager"
        description="Markdown-powered knowledge base, idea repository, and tagged documentation."
      >
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" />
          Create Note (Phase 6)
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Total Notes Stored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-secondary-text mt-1">
              Active documents in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-secondary-text">
              Pinned Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notes.filter((n) => n.isPinned).length}
            </div>
            <p className="text-xs text-secondary-text mt-1">
              High-priority quick access notes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Knowledge Repository
          </CardTitle>
          <CardDescription>
            Relational tagging and search indices are defined in PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="Knowledge base is empty"
            description="Full-featured rich text / markdown editing, tags, and semantic search will be released in Phase 6."
          />
        </CardContent>
      </Card>
    </div>
  );
}
