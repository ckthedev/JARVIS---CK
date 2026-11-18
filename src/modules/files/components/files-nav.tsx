"use client";

import React, { useState } from "react";
import {
  FileText,
  Clock,
  Image as ImageIcon,
  Video,
  Music,
  Table,
  Presentation,
  Archive,
  Code,
  File,
  Trash2,
  Folder as FolderIcon,
  Plus,
  ChevronDown,
  ChevronRight,
  HardDrive,
  ShieldCheck,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/storage/file-types";
import { FileViewSection, FolderDto, StorageOverviewStats } from "../types";

interface FilesNavProps {
  currentSection: FileViewSection;
  selectedFolderId: string | null;
  folders: FolderDto[];
  stats: StorageOverviewStats | null;
  onSelectSection: (section: FileViewSection, folderId?: string | null) => void;
  onOpenCreateFolder: (parentId?: string | null) => void;
  onOpenEditFolder: (folder: FolderDto) => void;
  onOpenDeleteFolder: (folder: FolderDto) => void;
  onOpenEmptyTrash: () => void;
  className?: string;
}

export function FilesNav({
  currentSection,
  selectedFolderId,
  folders,
  stats,
  onSelectSection,
  onOpenCreateFolder,
  onOpenEditFolder,
  onOpenDeleteFolder,
  onOpenEmptyTrash,
  className,
}: FilesNavProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);

  const totalUsedBytes = stats?.totalBytes || 0;
  const formattedStorage = formatBytes(totalUsedBytes);

  return (
    <div className={cn("flex flex-col h-full bg-[#0D1421] border-r border-border/80 select-none", className)}>
      {/* Primary Section Links */}
      <div className="p-3 space-y-1">
        <NavButton
          active={currentSection === "all" && !selectedFolderId}
          onClick={() => onSelectSection("all", null)}
          icon={<FileText className="h-4 w-4 text-cyan-400" />}
          label="All Files"
          count={stats?.totalFiles}
        />
        <NavButton
          active={currentSection === "recent"}
          onClick={() => onSelectSection("recent", null)}
          icon={<Clock className="h-4 w-4 text-purple-400" />}
          label="Recent Files"
        />
      </div>

      <div className="mx-3 border-t border-border/50" />

      {/* Scrollable Center: Categories & Folders */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Categories Section */}
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
          </div>

          {categoriesOpen && (
            <div className="space-y-0.5 mt-1">
              <NavButton
                active={currentSection === "images"}
                onClick={() => onSelectSection("images", null)}
                icon={<ImageIcon className="h-3.5 w-3.5 text-cyan-400" />}
                label="Images"
                size="sm"
              />
              <NavButton
                active={currentSection === "videos"}
                onClick={() => onSelectSection("videos", null)}
                icon={<Video className="h-3.5 w-3.5 text-purple-400" />}
                label="Videos"
                size="sm"
              />
              <NavButton
                active={currentSection === "audio"}
                onClick={() => onSelectSection("audio", null)}
                icon={<Music className="h-3.5 w-3.5 text-emerald-400" />}
                label="Audio"
                size="sm"
              />
              <NavButton
                active={currentSection === "documents"}
                onClick={() => onSelectSection("documents", null)}
                icon={<FileText className="h-3.5 w-3.5 text-amber-400" />}
                label="Documents"
                size="sm"
              />
              <NavButton
                active={currentSection === "spreadsheets"}
                onClick={() => onSelectSection("spreadsheets", null)}
                icon={<Table className="h-3.5 w-3.5 text-emerald-400" />}
                label="Spreadsheets"
                size="sm"
              />
              <NavButton
                active={currentSection === "presentations"}
                onClick={() => onSelectSection("presentations", null)}
                icon={<Presentation className="h-3.5 w-3.5 text-rose-400" />}
                label="Presentations"
                size="sm"
              />
              <NavButton
                active={currentSection === "archives"}
                onClick={() => onSelectSection("archives", null)}
                icon={<Archive className="h-3.5 w-3.5 text-amber-500" />}
                label="Archives"
                size="sm"
              />
              <NavButton
                active={currentSection === "code"}
                onClick={() => onSelectSection("code", null)}
                icon={<Code className="h-3.5 w-3.5 text-blue-400" />}
                label="Code Files"
                size="sm"
              />
              <NavButton
                active={currentSection === "other"}
                onClick={() => onSelectSection("other", null)}
                icon={<File className="h-3.5 w-3.5 text-slate-400" />}
                label="Other Files"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1 px-1">
            <button
              type="button"
              onClick={() => setFoldersOpen(!foldersOpen)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {foldersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>My Folders</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCreateFolder(null)}
              className="rounded p-0.5 text-secondary-text hover:text-primary hover:bg-card-hover transition-colors"
              title="Create Folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {foldersOpen && (
            <div className="space-y-0.5 mt-1">
              {folders.length === 0 ? (
                <div className="text-xs text-secondary-text/70 px-2 py-1.5 italic">
                  No folders yet. Click + to add one.
                </div>
              ) : (
                folders.map((folder) => {
                  const isSelected = currentSection === "folder" && selectedFolderId === folder.id;
                  const menuOpen = activeFolderMenuId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      className={cn(
                        "group relative flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/80 hover:bg-card-hover hover:text-foreground"
                      )}
                      onClick={() => onSelectSection("folder", folder.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                        <FolderIcon
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: folder.color || "#00D4FF" }}
                        />
                        <span className="truncate">{folder.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {typeof folder.fileCount === "number" && folder.fileCount > 0 && (
                          <span className="text-[10px] text-secondary-text font-mono">
                            {folder.fileCount}
                          </span>
                        )}

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFolderMenuId(menuOpen ? null : folder.id);
                            }}
                            className={cn(
                              "p-0.5 rounded text-secondary-text hover:text-foreground hover:bg-card-hover transition-opacity",
                              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            title="Folder Options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {menuOpen && (
                            <div
                              className="absolute right-0 top-6 z-30 w-32 rounded-md border border-border bg-[#0D1421] p-1 shadow-lg text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveFolderMenuId(null);
                                  onOpenEditFolder(folder);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-foreground hover:bg-card-hover hover:text-primary transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Rename / Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveFolderMenuId(null);
                                  onOpenDeleteFolder(folder);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete Folder</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Trash Section */}
        <div className="pt-2 border-t border-border/50">
          <NavButton
            active={currentSection === "trash"}
            onClick={() => onSelectSection("trash", null)}
            icon={<Trash2 className="h-4 w-4 text-red-400" />}
            label="Trash"
            count={stats?.trashCount}
          />
          {currentSection === "trash" && stats && stats.trashCount > 0 && (
            <button
              type="button"
              onClick={onOpenEmptyTrash}
              className="mt-2 w-full text-center text-[11px] font-medium text-red-400 hover:text-red-300 hover:underline py-1"
            >
              Empty Trash Now
            </button>
          )}
        </div>
      </div>

      {/* Storage Usage Bar at Bottom */}
      <div className="p-3 border-t border-border/80 bg-[#080D16]">
        <div className="flex items-center justify-between text-xs text-secondary-text mb-1.5">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Storage Usage</span>
          </div>
          <span className="font-mono text-[11px]">{formattedStorage}</span>
        </div>

        <div className="w-full bg-[#111B2B] h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, (totalUsedBytes / (100 * 1024 * 1024)) * 100))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-secondary-text">
          <span>{stats?.totalFiles ?? 0} files &bull; {stats?.totalFolders ?? 0} folders</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            <span>Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  size?: "sm" | "md";
}

function NavButton({ active, onClick, icon, label, count, size = "md" }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md transition-colors text-left",
        size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground/80 hover:bg-card-hover hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {typeof count === "number" && count > 0 && (
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
            active ? "bg-primary/20 text-primary" : "bg-[#111B2B] text-secondary-text"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
