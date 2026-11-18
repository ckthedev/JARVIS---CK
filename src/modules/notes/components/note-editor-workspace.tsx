"use client";

import React, { useState, useEffect } from "react";
import { NoteDto, NoteCategoryDto, NoteTagDto } from "../types";
import { TiptapEditor } from "./tiptap-editor";
import { AutosaveStatus, SaveState } from "./autosave-status";
import { NoteAttachments } from "@/modules/files/components/note-attachments";
import {
  Pin,
  Archive,
  Trash2,
  Copy,
  Folder,
  Tag,
  X,
  Plus,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface NoteEditorWorkspaceProps {
  note: NoteDto;
  categories: NoteCategoryDto[];
  tags: NoteTagDto[];
  saveState: SaveState;
  lastSavedAt: Date | null;
  onTitleChange: (newTitle: string) => void;
  onContentChange: (html: string, plainText: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onTagsChange: (tagNames: string[]) => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  onRetrySave?: () => void;
  onBackToList?: () => void;
  onOpenCategoryManager: () => void;
  className?: string;
}

export function NoteEditorWorkspace({
  note,
  categories,
  tags,
  saveState,
  lastSavedAt,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onTagsChange,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onPermanentDelete,
  onRetrySave,
  onBackToList,
  onOpenCategoryManager,
  className,
}: NoteEditorWorkspaceProps) {
  const [localTitle, setLocalTitle] = useState(note.title);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Sync title when note switches
  useEffect(() => {
    setLocalTitle(note.title);
  }, [note.id, note.title]);

  const handleTitleBlur = () => {
    if (localTitle.trim() !== note.title) {
      onTitleChange(localTitle.trim() || "Untitled Note");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();

    const tagToAdd = newTagInput.trim().replace(/^#/, "");
    if (!tagToAdd) {
      setShowTagInput(false);
      return;
    }

    const currentTagNames = note.tags.map((t) => t.name.toLowerCase());
    if (!currentTagNames.includes(tagToAdd.toLowerCase())) {
      const updatedTagNames = [...note.tags.map((t) => t.name), tagToAdd];
      onTagsChange(updatedTagNames);
    }

    setNewTagInput("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagNameToRemove: string) => {
    const updatedTagNames = note.tags
      .map((t) => t.name)
      .filter((name) => name.toLowerCase() !== tagNameToRemove.toLowerCase());
    onTagsChange(updatedTagNames);
  };

  const isTrash = !!note.deletedAt;

  return (
    <div className={cn("flex flex-col h-full bg-[#080D16] overflow-hidden", className)}>
      {/* Top Workspace Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-[#0A101C] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="md:hidden rounded-md p-1.5 text-secondary-text hover:text-foreground hover:bg-card-hover"
              title="Back to notes list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* Autosave Status */}
          <AutosaveStatus
            state={saveState}
            lastSavedAt={lastSavedAt}
            onRetry={onRetrySave}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {!isTrash ? (
            <>
              <button
                type="button"
                onClick={onTogglePin}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors border",
                  note.isPinned
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    : "border-border text-secondary-text hover:text-foreground hover:bg-card-hover"
                )}
                title={note.isPinned ? "Unpin Note" : "Pin Note to top"}
              >
                <Pin className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{note.isPinned ? "Pinned" : "Pin"}</span>
              </button>

              <button
                type="button"
                onClick={onToggleArchive}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors border",
                  note.isArchived
                    ? "bg-secondary/15 border-secondary/30 text-[#A78BFA] hover:bg-secondary/25"
                    : "border-border text-secondary-text hover:text-foreground hover:bg-card-hover"
                )}
                title={note.isArchived ? "Unarchive Note" : "Archive Note"}
              >
                <Archive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{note.isArchived ? "Archived" : "Archive"}</span>
              </button>

              <button
                type="button"
                onClick={onDuplicate}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-secondary-text hover:text-foreground hover:bg-card-hover transition-colors"
                title="Duplicate Note"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Duplicate</span>
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 rounded-md border border-red-500/20 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                title="Move Note to Trash"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trash</span>
              </button>
            </>
          ) : (
            <>
              {onRestore && (
                <button
                  type="button"
                  onClick={onRestore}
                  className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Note
                </button>
              )}
              {onPermanentDelete && (
                <button
                  type="button"
                  onClick={onPermanentDelete}
                  className="flex items-center gap-1 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Permanently
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-4xl w-full mx-auto space-y-4">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            disabled={isTrash}
            placeholder="Untitled Note"
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-secondary-text/40 focus:outline-none border-b border-transparent focus:border-border/60 pb-1.5 transition-colors disabled:opacity-75"
          />
        </div>

        {/* Metadata Controls: Category & Tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs border-y border-border/40 py-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-secondary-text" />
            <span className="text-secondary-text">Category:</span>
            <select
              value={note.categoryId || ""}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              disabled={isTrash}
              className="bg-[#111B2B] border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-60"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!isTrash && (
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="text-secondary-text hover:text-primary p-0.5 rounded"
                title="Manage Categories"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="h-3.5 w-[1px] bg-border/60 hidden sm:block" />

          {/* Tags Chips & Add Input */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-secondary-text shrink-0" />
            {note.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-sidebar-accent px-2 py-0.5 text-[11px] text-foreground border border-border"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color || "#7A3FFF" }}
                />
                #{tag.name}
                {!isTrash && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.name)}
                    className="text-secondary-text hover:text-red-400 ml-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </span>
            ))}

            {!isTrash && (
              showTagInput ? (
                <>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={handleAddTag}
                    list="available-note-tags"
                    placeholder="tag name..."
                    autoFocus
                    className="h-6 w-24 rounded bg-[#111B2B] border border-primary px-2 text-[11px] text-foreground focus:outline-none"
                  />
                  <datalist id="available-note-tags">
                    {tags.map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                  </datalist>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-secondary-text hover:text-foreground hover:border-border/80"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add Tag
                </button>
              )
            )}
          </div>
        </div>

        {/* Tiptap Rich-Text Editor */}
        <TiptapEditor
          content={note.content}
          onChange={onContentChange}
          editable={!isTrash}
          placeholder="Start writing note... Use the formatting toolbar or markdown shortcuts."
          className="min-h-[420px]"
        />

        {/* Note Attachments Integration */}
        <NoteAttachments noteId={note.id} readOnly={isTrash} />

        {/* Document Stats Footer */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-secondary-text/70 pt-2 border-t border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <span>{note.wordCount} words</span>
            <span>&bull;</span>
            <span>{note.plainText.length} characters</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Created: {formatDate(note.createdAt)}</span>
            <span>&bull;</span>
            <span>Updated: {formatDate(note.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
