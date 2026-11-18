"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  NoteDto,
  NoteCategoryDto,
  NoteTagDto,
  NoteViewSection,
  DashboardNoteStats,
} from "../types";
import { NotesNav } from "./notes-nav";
import { NotesList } from "./notes-list";
import { NoteEditorWorkspace } from "./note-editor-workspace";
import { CategoryManagerModal } from "./category-manager-modal";
import { TagManagerModal } from "./tag-manager-modal";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { SaveState } from "./autosave-status";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotesManagerProps {
  initialCategories: NoteCategoryDto[];
  initialTags: NoteTagDto[];
  initialStats: DashboardNoteStats;
  initialNotes: NoteDto[];
  initialSelectedNoteId?: string;
}

export function NotesManager({
  initialCategories,
  initialTags,
  initialStats,
  initialNotes,
  initialSelectedNoteId,
}: NotesManagerProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Navigation states
  const initialSection = (searchParams.get("section") as NoteViewSection) || "all";
  const [currentSection, setCurrentSection] = useState<NoteViewSection>(initialSection);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    searchParams.get("categoryId") || undefined
  );
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>(
    searchParams.get("tagId") || undefined
  );

  // Search & Sorting
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "title" | "oldest">("updatedAt");

  // Data states
  const [notes, setNotes] = useState<NoteDto[]>(initialNotes);
  const [categories, setCategories] = useState<NoteCategoryDto[]>(initialCategories);
  const [tags, setTags] = useState<NoteTagDto[]>(initialTags);
  const [stats, setStats] = useState<DashboardNoteStats>(initialStats);
  const [loading, setLoading] = useState(false);

  // Selected note
  const [selectedNote, setSelectedNote] = useState<NoteDto | null>(() => {
    if (initialSelectedNoteId) {
      const match = initialNotes.find((n) => n.id === initialSelectedNoteId);
      if (match) return match;
    }
    return initialNotes.length > 0 ? initialNotes[0] : null;
  });

  // Mobile view state (show list vs show editor)
  const [mobileShowEditor, setMobileShowEditor] = useState<boolean>(() => {
    return !!initialSelectedNoteId && initialNotes.length > 0;
  });

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permanentDeleteTargetId, setPermanentDeleteTargetId] = useState<string | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);

  // ===========================================================================
  // AUTOSAVE ENGINE
  // ===========================================================================
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Pending unsaved edits ref
  const pendingChangesRef = useRef<{
    noteId: string;
    title?: string;
    content?: string;
    plainText?: string;
    categoryId?: string | null;
    tagNames?: string[];
  } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSaveRequestRef = useRef<number>(0);

  // Fetch updated stats & categories
  const refreshStats = useCallback(async () => {
    try {
      const [statsRes, catRes, tagRes] = await Promise.all([
        fetch("/api/notes/stats"),
        fetch("/api/notes/categories"),
        fetch("/api/notes/tags"),
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (catRes.ok) {
        const c = await catRes.json();
        setCategories(c.categories);
      }
      if (tagRes.ok) {
        const t = await tagRes.json();
        setTags(t.tags);
      }
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    }
  }, []);

  // Fetch notes based on current filters
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentSection) params.set("section", currentSection);
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      if (selectedTagId) params.set("tagId", selectedTagId);
      if (search.trim()) params.set("search", search.trim());
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notes");

      const data = await res.json();
      setNotes(data.notes);

      // If currently selected note is not in returned list, select first available
      if (data.notes.length > 0) {
        setSelectedNote((prev) => {
          if (!prev) return data.notes[0];
          const exists = data.notes.find((n: NoteDto) => n.id === prev.id);
          return exists || data.notes[0];
        });
      } else {
        setSelectedNote(null);
      }
    } catch (err: unknown) {
      console.error("fetchNotes error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentSection, selectedCategoryId, selectedTagId, search, sortBy]);

  // Execute actual save request to PostgreSQL
  const flushSave = useCallback(async () => {
    if (!pendingChangesRef.current) return;

    const changes = { ...pendingChangesRef.current };
    pendingChangesRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentReqId = ++activeSaveRequestRef.current;
    setSaveState("saving");

    try {
      const res = await fetch(`/api/notes/${changes.noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const data = await res.json();

      // Ensure no newer request has superseded this one
      if (currentReqId === activeSaveRequestRef.current) {
        setSaveState("saved");
        const now = new Date();
        setLastSavedAt(now);

        // Update in notes list
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n.id === data.note.id ? data.note : n))
        );

        // Update selected note if still on this note
        setSelectedNote((prev) => (prev?.id === data.note.id ? data.note : prev));
      }
    } catch (err: unknown) {
      console.error("Autosave error:", err);
      // Restore pending changes so retry can happen
      pendingChangesRef.current = changes;
      setSaveState("error");
    }
  }, []);

  // Queue a debounced save (800ms)
  const queueSave = useCallback(
    (noteId: string, updates: Partial<NoteDto> & { tagNames?: string[] }) => {
      setSaveState("unsaved");

      pendingChangesRef.current = {
        noteId,
        ...(pendingChangesRef.current?.noteId === noteId ? pendingChangesRef.current : {}),
        ...updates,
      };

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        flushSave();
      }, 800);
    },
    [flushSave]
  );

  // Flush pending save before switching notes or unmounting
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pendingChangesRef.current) {
        flushSave();
      }
    };
  }, [flushSave]);

  // Refetch notes when filters change
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ===========================================================================
  // NOTE SELECTION & EDITING HANDLERS
  // ===========================================================================

  const handleSelectNote = async (note: NoteDto) => {
    // Flush any pending changes on existing note first
    if (pendingChangesRef.current) {
      await flushSave();
    }
    setSelectedNote(note);
    setMobileShowEditor(true);
    setSaveState("saved");
  };

  const handleCreateNote = async () => {
    try {
      if (pendingChangesRef.current) {
        await flushSave();
      }

      const defaultCategory =
        currentSection === "category" && selectedCategoryId ? selectedCategoryId : null;

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "<p></p>",
          categoryId: defaultCategory,
          tagNames: currentSection === "tag" && selectedTagId ? [tags.find((t) => t.id === selectedTagId)?.name || ""] : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create note");
      }

      const data = await res.json();
      const newNote = data.note;

      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      setMobileShowEditor(true);
      setSaveState("saved");

      toast({
        title: "Note Created",
        description: "New document ready for writing.",
      });

      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create note";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!selectedNote) return;
    setSelectedNote((prev) => (prev ? { ...prev, title: newTitle } : null));
    queueSave(selectedNote.id, { title: newTitle });
  };

  const handleContentChange = (html: string, plainText: string) => {
    if (!selectedNote) return;
    setSelectedNote((prev) => (prev ? { ...prev, content: html, plainText } : null));
    queueSave(selectedNote.id, { content: html, plainText });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    if (!selectedNote) return;
    const cat = categories.find((c) => c.id === categoryId) || null;
    setSelectedNote((prev) => (prev ? { ...prev, categoryId, category: cat } : null));
    queueSave(selectedNote.id, { categoryId });
  };

  const handleTagsChange = (tagNames: string[]) => {
    if (!selectedNote) return;
    const dummyTags = tagNames.map((name) => ({
      id: name,
      userId: selectedNote.userId,
      name,
      color: "#7A3FFF",
    }));
    setSelectedNote((prev) => (prev ? { ...prev, tags: dummyTags } : null));
    queueSave(selectedNote.id, { tagNames });
  };

  const handleTogglePin = async (noteId?: string) => {
    const targetId = noteId || selectedNote?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/notes/${targetId}/pin`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle pin");
      const data = await res.json();

      setNotes((prev) =>
        prev.map((n) => (n.id === targetId ? { ...n, isPinned: data.isPinned } : n))
      );

      if (selectedNote?.id === targetId) {
        setSelectedNote((prev) => (prev ? { ...prev, isPinned: data.isPinned } : null));
      }

      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to toggle pin";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleToggleArchive = async (noteId?: string) => {
    const targetId = noteId || selectedNote?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/notes/${targetId}/archive`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle archive");
      const data = await res.json();

      toast({
        title: data.isArchived ? "Note Archived" : "Note Unarchived",
        description: data.isArchived ? "Moved to Archive." : "Restored to active notes.",
      });

      fetchNotes();
      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to toggle archive";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (noteId?: string) => {
    const targetId = noteId || selectedNote?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/notes/${targetId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate note");
      const data = await res.json();

      setNotes((prev) => [data.note, ...prev]);
      setSelectedNote(data.note);
      setMobileShowEditor(true);

      toast({
        title: "Note Duplicated",
        description: `Created "${data.note.title}".`,
      });

      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to duplicate note";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleSoftDelete = async (noteId?: string) => {
    const targetId = noteId || selectedNote?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/notes/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");

      toast({
        title: "Moved to Trash",
        description: "Note moved to trash. Can be restored anytime.",
      });

      // Remove from list
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      if (selectedNote?.id === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length === 0) setMobileShowEditor(false);
      }

      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete note";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleRestore = async (noteId?: string) => {
    const targetId = noteId || selectedNote?.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/notes/${targetId}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to restore note");

      toast({
        title: "Note Restored",
        description: "Note restored back to active documents.",
      });

      // Remove from trash list
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      if (selectedNote?.id === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length === 0) setMobileShowEditor(false);
      }

      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to restore note";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!permanentDeleteTargetId) return;

    try {
      const res = await fetch(`/api/notes/${permanentDeleteTargetId}/permanent`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to permanently delete note");

      toast({
        title: "Permanently Deleted",
        description: "Document permanently removed from database.",
      });

      setNotes((prev) => prev.filter((n) => n.id !== permanentDeleteTargetId));
      if (selectedNote?.id === permanentDeleteTargetId) {
        const remaining = notes.filter((n) => n.id !== permanentDeleteTargetId);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length === 0) setMobileShowEditor(false);
      }

      setPermanentDeleteTargetId(null);
      setDeleteConfirmOpen(false);
      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to permanently delete note";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleEmptyTrashConfirm = async () => {
    try {
      const res = await fetch("/api/notes/trash", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to empty trash");
      const data = await res.json();

      toast({
        title: "Trash Emptied",
        description: `${data.count} notes permanently deleted.`,
      });

      setNotes([]);
      setSelectedNote(null);
      setMobileShowEditor(false);
      setEmptyTrashConfirmOpen(false);
      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to empty trash";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleSelectSection = (
    section: NoteViewSection,
    categoryId?: string,
    tagId?: string
  ) => {
    setCurrentSection(section);
    setSelectedCategoryId(categoryId);
    setSelectedTagId(tagId);
    setSearch("");
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-xl border border-border/80 bg-[#080D16] overflow-hidden shadow-2xl">
      {/* 1. Left Navigation Panel (240px desktop, hidden on mobile) */}
      <div className="hidden lg:block w-56 xl:w-60 shrink-0 h-full">
        <NotesNav
          currentSection={currentSection}
          selectedCategoryId={selectedCategoryId}
          selectedTagId={selectedTagId}
          stats={stats}
          categories={categories}
          tags={tags}
          onSelectSection={handleSelectSection}
          onOpenCategoryManager={() => setCategoryModalOpen(true)}
          onOpenTagManager={() => setTagModalOpen(true)}
          onEmptyTrash={() => setEmptyTrashConfirmOpen(true)}
        />
      </div>

      {/* 2. Middle Notes List Panel (320px desktop, full width on mobile when editor hidden) */}
      <div
        className={`w-full lg:w-80 shrink-0 h-full ${
          mobileShowEditor ? "hidden md:block" : "block"
        }`}
      >
        <NotesList
          notes={notes}
          selectedNoteId={selectedNote?.id || null}
          currentSection={currentSection}
          search={search}
          sortBy={sortBy}
          loading={loading}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onSearchChange={setSearch}
          onSortChange={setSortBy}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onDuplicate={handleDuplicate}
          onDelete={handleSoftDelete}
          onRestore={handleRestore}
          onPermanentDelete={(id) => {
            setPermanentDeleteTargetId(id);
            setDeleteConfirmOpen(true);
          }}
        />
      </div>

      {/* 3. Right Editor Workspace (flex-1 desktop, full width on mobile when editor shown) */}
      <div
        className={`flex-1 h-full overflow-hidden ${
          !mobileShowEditor ? "hidden md:block" : "block"
        }`}
      >
        {selectedNote ? (
          <NoteEditorWorkspace
            note={selectedNote}
            categories={categories}
            tags={tags}
            saveState={saveState}
            lastSavedAt={lastSavedAt}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            onCategoryChange={handleCategoryChange}
            onTagsChange={handleTagsChange}
            onTogglePin={() => handleTogglePin()}
            onToggleArchive={() => handleToggleArchive()}
            onDuplicate={() => handleDuplicate()}
            onDelete={() => handleSoftDelete()}
            onRestore={() => handleRestore()}
            onPermanentDelete={() => {
              setPermanentDeleteTargetId(selectedNote.id);
              setDeleteConfirmOpen(true);
            }}
            onRetrySave={flushSave}
            onBackToList={() => setMobileShowEditor(false)}
            onOpenCategoryManager={() => setCategoryModalOpen(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[#080D16]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/80 text-primary mb-4 shadow-lg">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No note selected</h3>
            <p className="mt-1.5 max-w-sm text-xs text-secondary-text">
              Choose an existing document from the list or create a new note to start writing.
            </p>
            <Button
              size="sm"
              onClick={handleCreateNote}
              className="mt-5 gap-1.5 bg-primary text-black hover:bg-primary/90 font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
          </div>
        )}
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onRefresh={refreshStats}
      />

      {/* Tag Manager Modal */}
      <TagManagerModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        tags={tags}
        onRefresh={refreshStats}
      />

      {/* Permanent Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPermanentDeleteTargetId(null);
        }}
        onConfirm={handlePermanentDeleteConfirm}
        title="Permanently Delete Note?"
        description="This action cannot be undone. This document will be completely deleted from the database."
        confirmText="Delete Forever"
      />

      {/* Empty Trash Confirmation Modal */}
      <DeleteConfirmationDialog
        open={emptyTrashConfirmOpen}
        onClose={() => setEmptyTrashConfirmOpen(false)}
        onConfirm={handleEmptyTrashConfirm}
        title="Empty Trash?"
        description={`This will permanently delete all ${stats.trash} notes currently in the trash. This cannot be undone.`}
        confirmText="Empty All Trash"
      />
    </div>
  );
}
