"use client";

import React, { useState } from "react";
import { NoteViewSection, NoteCategoryDto, NoteTagDto, DashboardNoteStats } from "../types";
import {
  FileText,
  Pin,
  Archive,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesNavProps {
  currentSection: NoteViewSection;
  selectedCategoryId?: string;
  selectedTagId?: string;
  stats: DashboardNoteStats;
  categories: NoteCategoryDto[];
  tags: NoteTagDto[];
  onSelectSection: (section: NoteViewSection, categoryId?: string, tagId?: string) => void;
  onOpenCategoryManager: () => void;
  onOpenTagManager: () => void;
  onEmptyTrash: () => void;
  className?: string;
}

export function NotesNav({
  currentSection,
  selectedCategoryId,
  selectedTagId,
  stats,
  categories,
  tags,
  onSelectSection,
  onOpenCategoryManager,
  onOpenTagManager,
  onEmptyTrash,
  className,
}: NotesNavProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

  return (
    <div className={cn("flex flex-col h-full bg-[#141414] border-r border-[#292929] select-none", className)}>
      {/* Primary Section Links */}
      <div className="p-3 space-y-1">
        <NavButton
          active={currentSection === "all"}
          onClick={() => onSelectSection("all")}
          icon={<FileText className="h-4 w-4 text-[#A3A3A3]" />}
          label="All Notes"
          count={stats.totalActive}
        />
        <NavButton
          active={currentSection === "pinned"}
          onClick={() => onSelectSection("pinned")}
          icon={<Pin className="h-4 w-4 text-[#A3A3A3]" />}
          label="Pinned Notes"
          count={stats.pinned}
        />
        <NavButton
          active={currentSection === "archived"}
          onClick={() => onSelectSection("archived")}
          icon={<Archive className="h-4 w-4 text-[#737373]" />}
          label="Archived"
          count={stats.archived}
        />
        <NavButton
          active={currentSection === "trash"}
          onClick={() => onSelectSection("trash")}
          icon={<Trash2 className="h-4 w-4 text-[#EF4444]" />}
          label="Trash"
          count={stats.trash}
        />
      </div>

      <div className="mx-3 my-1 border-t border-[#292929]" />

      {/* Categories Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1 px-1">
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center gap-1 hover:text-[#F5F5F5] transition-colors"
            >
              {categoriesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="rounded p-0.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#252525] transition-colors"
              title="Manage Categories"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {categoriesOpen && (
            <div className="space-y-0.5 mt-1">
              {categories.length === 0 ? (
                <p className="text-[11px] text-[#737373] px-2 py-1 italic">No categories</p>
              ) : (
                categories.map((cat) => {
                  const isSelected = currentSection === "category" && selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onSelectSection("category", cat.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors",
                        isSelected
                          ? "bg-[#343434] text-[#F5F5F5] font-medium border border-[#404040]"
                          : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#888888" }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className="text-[10px] text-[#737373] ml-1">
                        {cat.noteCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1 px-1">
            <button
              type="button"
              onClick={() => setTagsOpen(!tagsOpen)}
              className="flex items-center gap-1 hover:text-[#F5F5F5] transition-colors"
            >
              {tagsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Tags</span>
            </button>
            <button
              type="button"
              onClick={onOpenTagManager}
              className="rounded p-0.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#252525] transition-colors"
              title="Manage Tags"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {tagsOpen && (
            <div className="space-y-0.5 mt-1">
              {tags.length === 0 ? (
                <p className="text-[11px] text-[#737373] px-2 py-1 italic">No tags</p>
              ) : (
                tags.map((tag) => {
                  const isSelected = currentSection === "tag" && selectedTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onSelectSection("tag", undefined, tag.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors",
                        isSelected
                          ? "bg-[#343434] text-[#F5F5F5] font-medium border border-[#404040]"
                          : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
                      )}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || "#888888" }}
                        />
                        <span className="truncate">#{tag.name}</span>
                      </div>
                      <span className="text-[10px] text-[#737373] ml-1">
                        {tag.noteCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions: Trash Empty or Manage Settings */}
      {currentSection === "trash" && stats.trash > 0 && (
        <div className="p-3 border-t border-[#292929]">
          <button
            type="button"
            onClick={onEmptyTrash}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#EF4444] bg-[#2A1818] hover:bg-[#381F1F] border border-[#502020] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Empty Trash
          </button>
        </div>
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]"
          : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px]",
            active ? "bg-[#202020] text-[#F5F5F5] font-semibold" : "bg-[#202020] text-[#737373]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
