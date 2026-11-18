import React, { Suspense } from "react";
import { requireAuth } from "@/lib/auth/session";
import { noteService } from "@/modules/notes/service";
import { NotesManager } from "@/modules/notes/components/notes-manager";
import { NoteViewSection } from "@/modules/notes/types";

export const dynamic = "force-dynamic";

interface NotesPageProps {
  searchParams: Promise<{
    section?: string;
    categoryId?: string;
    tagId?: string;
    note?: string;
    search?: string;
  }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const user = await requireAuth();
  const params = await searchParams;

  const section = (params.section as NoteViewSection) || "all";
  const categoryId = params.categoryId;
  const tagId = params.tagId;
  const search = params.search;
  const selectedNoteId = params.note;

  // Server-side initial data hydration
  const [categories, tags, stats, initialNotes] = await Promise.all([
    noteService.seedDefaultCategories(user.id),
    noteService.getTags(user.id),
    noteService.getDashboardNoteStats(user.id),
    noteService.getNotes(user.id, {
      section,
      categoryId,
      tagId,
      search,
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8.5rem)] items-center justify-center text-sm text-secondary-text">
          Loading Notes Manager...
        </div>
      }
    >
      <NotesManager
        initialCategories={categories}
        initialTags={tags}
        initialStats={stats}
        initialNotes={initialNotes}
        initialSelectedNoteId={selectedNoteId}
      />
    </Suspense>
  );
}
