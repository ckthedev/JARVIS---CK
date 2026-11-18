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
    <div className={cn("flex flex-col h-full bg-[#0D1421] border-r border-border/80 select-none", className)}>
      {/* Primary Section Links */}
      <div className="p-3 space-y-1">
        <NavButton
          active={currentSection === "all"}
          onClick={() => onSelectSection("all")}
          icon={<FileText className="h-4 w-4 text-primary" />}
          label="All Notes"
          count={stats.totalActive}
        />
        <NavButton
          active={currentSection === "pinned"}
          onClick={() => onSelectSection("pinned")}
          icon={<Pin className="h-4 w-4 text-amber-400" />}
          label="Pinned Notes"
          count={stats.pinned}
        />
        <NavButton
          active={currentSection === "archived"}
          onClick={() => onSelectSection("archived")}
          icon={<Archive className="h-4 w-4 text-secondary-text" />}
          label="Archived"
          count={stats.archived}
        />
        <NavButton
          active={currentSection === "trash"}
          onClick={() => onSelectSection("trash")}
          icon={<Trash2 className="h-4 w-4 text-red-400" />}
          label="Trash"
          count={stats.trash}
        />
      </div>

      <div className="mx-3 my-1 border-t border-border/50" />

      {/* Categories Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1 px-1">
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {categoriesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="rounded p-0.5 text-secondary-text hover:text-primary hover:bg-card-hover transition-colors"
              title="Manage Categories"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {categoriesOpen && (
            <div className="space-y-0.5 mt-1">
              {categories.length === 0 ? (
                <p className="text-[11px] text-secondary-text/70 px-2 py-1 italic">No categories</p>
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
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-secondary-text hover:text-foreground hover:bg-card-hover"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#00D4FF" }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className="text-[10px] text-secondary-text/70 ml-1">
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
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1 px-1">
            <button
              type="button"
              onClick={() => setTagsOpen(!tagsOpen)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {tagsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Tags</span>
            </button>
            <button
              type="button"
              onClick={onOpenTagManager}
              className="rounded p-0.5 text-secondary-text hover:text-primary hover:bg-card-hover transition-colors"
              title="Manage Tags"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {tagsOpen && (
            <div className="space-y-0.5 mt-1">
              {tags.length === 0 ? (
                <p className="text-[11px] text-secondary-text/70 px-2 py-1 italic">No tags</p>
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
                          ? "bg-secondary/20 text-[#A78BFA] font-medium"
                          : "text-secondary-text hover:text-foreground hover:bg-card-hover"
                      )}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || "#7A3FFF" }}
                        />
                        <span className="truncate">#{tag.name}</span>
                      </div>
                      <span className="text-[10px] text-secondary-text/70 ml-1">
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
        <div className="p-3 border-t border-border/60">
          <button
            type="button"
            onClick={onEmptyTrash}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
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
          ? "bg-card text-foreground border border-border shadow-sm"
          : "text-secondary-text hover:text-foreground hover:bg-card/50"
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px]",
            active ? "bg-primary/20 text-primary font-semibold" : "bg-sidebar-accent text-secondary-text"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
