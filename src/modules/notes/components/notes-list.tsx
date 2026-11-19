"use client";

import React, { useState } from "react";
import { NoteDto, NoteViewSection } from "../types";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Pin,
  Archive,
  Trash2,
  Copy,
  Plus,
  ArrowUpDown,
  MoreVertical,
  RotateCcw,
  FileText,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface NotesListProps {
  notes: NoteDto[];
  selectedNoteId: string | null;
  currentSection: NoteViewSection;
  search: string;
  sortBy: string;
  loading: boolean;
  onSelectNote: (note: NoteDto) => void;
  onCreateNote: () => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: "updatedAt" | "createdAt" | "title" | "oldest") => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDuplicate: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onRestore?: (noteId: string) => void;
  onPermanentDelete?: (noteId: string) => void;
  className?: string;
}

export function NotesList({
  notes,
  selectedNoteId,
  currentSection,
  search,
  sortBy,
  loading,
  onSelectNote,
  onCreateNote,
  onSearchChange,
  onSortChange,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onPermanentDelete,
  className,
}: NotesListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isTrash = currentSection === "trash";

  return (
    <div className={cn("flex flex-col h-full bg-[#181818] border-r border-[#292929]", className)}>
      {/* Header & Search */}
      <div className="p-3 border-b border-[#292929] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            {currentSection === "all" && "All Notes"}
            {currentSection === "pinned" && "Pinned Notes"}
            {currentSection === "archived" && "Archived Notes"}
            {currentSection === "trash" && "Trash"}
            {currentSection === "category" && "Category Notes"}
            {currentSection === "tag" && "Tagged Notes"}
            <span className="text-[#555555] ml-1.5 font-normal">({notes.length})</span>
          </span>

          {!isTrash && (
            <button
              type="button"
              onClick={onCreateNote}
              className="flex items-center gap-1 text-xs font-medium text-[#F5F5F5] bg-[#383838] hover:bg-[#454545] px-2.5 py-1 rounded-md transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Note
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#737373]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, tags, categories..."
            className="h-8 pl-8 pr-8 text-xs bg-[#141414] border-[#303030] text-[#F5F5F5] focus:border-[#454545]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#F5F5F5]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-[11px] text-[#737373] pt-0.5">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as "updatedAt" | "createdAt" | "title" | "oldest")}
            className="bg-transparent text-[#A3A3A3] hover:text-[#F5F5F5] focus:outline-none text-[11px] cursor-pointer"
          >
            <option value="updatedAt" className="bg-[#181818]">Recently Updated</option>
            <option value="createdAt" className="bg-[#181818]">Recently Created</option>
            <option value="title" className="bg-[#181818]">Title (A-Z)</option>
            <option value="oldest" className="bg-[#181818]">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Note Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#737373]">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <FileText className="h-8 w-8 text-[#555555] mx-auto mb-2" />
            <p className="text-xs font-medium text-[#F5F5F5]">
              {search ? "No matching notes found" : isTrash ? "Trash is empty" : "No notes yet"}
            </p>
            <p className="text-[11px] text-[#737373] mt-1">
              {search
                ? "Try adjusting your search terms"
                : isTrash
                ? "Deleted notes will appear here"
                : "Click '+ New Note' to create your first document."}
            </p>
            {!isTrash && !search && (
              <button
                type="button"
                onClick={onCreateNote}
                className="mt-3 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] font-medium inline-block underline"
              >
                Create note
              </button>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={cn(
                  "group relative flex flex-col p-3 rounded-lg border transition-all cursor-pointer text-left",
                  isSelected
                    ? "bg-[#262626] border-[#383838] shadow-sm"
                    : "bg-[#202020] border-[#292929] hover:border-[#383838] hover:bg-[#242424]"
                )}
              >
                {/* Title & Pin Icon */}
                <div className="flex items-start justify-between gap-1.5">
                  <h4
                    className={cn(
                      "text-xs font-semibold truncate",
                      isSelected ? "text-[#F5F5F5]" : "text-[#D4D4D4]"
                    )}
                  >
                    {note.title || "Untitled Note"}
                  </h4>

                  <div className="flex items-center gap-1 shrink-0">
                    {note.isPinned && !isTrash && (
                      <Pin className="h-3 w-3 text-[#A3A3A3]" />
                    )}

                    {/* Actions Menu Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === note.id ? null : note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] transition-opacity"
                        title="Note options"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === note.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-5 z-30 w-36 rounded-md border border-[#303030] bg-[#262626] py-1 shadow-xl text-xs space-y-0.5"
                        >
                          {!isTrash ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onTogglePin(note.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5]"
                              >
                                <Pin className="h-3 w-3" />
                                {note.isPinned ? "Unpin" : "Pin"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleArchive(note.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5]"
                              >
                                <Archive className="h-3 w-3" />
                                {note.isArchived ? "Unarchive" : "Archive"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDuplicate(note.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5]"
                              >
                                <Copy className="h-3 w-3" />
                                Duplicate
                              </button>
                              <div className="border-t border-[#303030] my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  onDelete(note.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#2A1818] text-[#EF4444]"
                              >
                                <Trash2 className="h-3 w-3" />
                                Move to Trash
                              </button>
                            </>
                          ) : (
                            <>
                              {onRestore && (
                                <button
                                   type="button"
                                   onClick={() => {
                                     onRestore(note.id);
                                     setActiveMenuId(null);
                                   }}
                                   className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#303030] text-[#A3A3A3]"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Restore Note
                                </button>
                              )}
                              {onPermanentDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPermanentDelete(note.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#2A1818] text-[#EF4444]"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete Forever
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plain Text Snippet */}
                <p className="mt-1 text-[11px] text-[#A3A3A3] line-clamp-2 leading-relaxed">
                  {note.plainText || "Empty document"}
                </p>

                {/* Metadata Footer: Category & Tags & Date */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#737373]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D4D4D4]">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: note.category.color || "#888888" }}
                        />
                        {note.category.name}
                      </span>
                    )}

                    {note.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="rounded bg-[#181818] border border-[#292929] px-1.5 py-0.5 text-[9px] text-[#A3A3A3]"
                      >
                        #{t.name}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[9px] text-[#737373]">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-[10px] text-[#737373] ml-2">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
