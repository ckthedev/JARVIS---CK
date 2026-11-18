"use client";

import React from "react";
import {
  Search,
  LayoutGrid,
  List,
  FolderPlus,
  Upload,
  ChevronRight,
  ArrowUpDown,
  X,
  Trash2,
  FolderInput,
  Download,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderBreadcrumb, FileViewSection } from "../types";

interface FilesToolbarProps {
  currentSection: FileViewSection;
  breadcrumbs: FolderBreadcrumb[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: "createdAt" | "name" | "sizeBytes";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: "createdAt" | "name" | "sizeBytes", sortOrder: "asc" | "desc") => void;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isAllSelected: boolean;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onNavigateBreadcrumb: (folderId: string | null) => void;
  onBulkMove: () => void;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkPermanentDelete: () => void;
}

export function FilesToolbar({
  currentSection,
  breadcrumbs,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  selectedCount,
  onSelectAll,
  onClearSelection,
  isAllSelected,
  onOpenUpload,
  onOpenCreateFolder,
  onNavigateBreadcrumb,
  onBulkMove,
  onBulkDownload,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
}: FilesToolbarProps) {
  const getSectionTitle = () => {
    switch (currentSection) {
      case "all":
        return "All Files";
      case "recent":
        return "Recent Files";
      case "images":
        return "Images";
      case "videos":
        return "Videos";
      case "audio":
        return "Audio";
      case "documents":
        return "Documents";
      case "spreadsheets":
        return "Spreadsheets";
      case "presentations":
        return "Presentations";
      case "archives":
        return "Archives";
      case "code":
        return "Code Files";
      case "other":
        return "Other Files";
      case "trash":
        return "Trash";
      case "folder":
        return "Files";
      default:
        return "Files";
    }
  };

  return (
    <div className="flex flex-col border-b border-border/80 bg-[#080D16]">
      {/* Top Bar: Breadcrumb + Action Buttons */}
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <button
            type="button"
            onClick={() => onNavigateBreadcrumb(null)}
            className={cn(
              "font-medium transition-colors hover:text-primary",
              breadcrumbs.length === 0 ? "text-foreground" : "text-secondary-text"
            )}
          >
            {getSectionTitle()}
          </button>

          {currentSection === "folder" &&
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="h-4 w-4 text-secondary-text/60 shrink-0" />
                <button
                  type="button"
                  onClick={() => onNavigateBreadcrumb(crumb.id)}
                  className={cn(
                    "truncate transition-colors hover:text-primary",
                    idx === breadcrumbs.length - 1
                      ? "text-primary font-medium"
                      : "text-secondary-text"
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {currentSection !== "trash" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateFolder}
                className="h-8 gap-1.5 border-border bg-[#0D1421] text-xs hover:border-primary/50"
              >
                <FolderPlus className="h-3.5 w-3.5 text-primary" />
                <span>New Folder</span>
              </Button>

              <Button
                size="sm"
                onClick={onOpenUpload}
                className="h-8 gap-1.5 bg-primary text-black font-medium hover:bg-primary/90 text-xs shadow-md shadow-primary/20"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter, Search, Sort & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#0D1421]/60 border-t border-border/40">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-secondary-text" />
            <Input
              type="text"
              placeholder="Search files by name or extension..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs bg-[#111B2B] border-border text-foreground placeholder:text-secondary-text/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-2.5 text-secondary-text hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sort & View Mode Switches */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#111B2B] rounded-md border border-border px-2 py-1 text-xs">
            <ArrowUpDown className="h-3 w-3 text-secondary-text" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-") as [
                  "createdAt" | "name" | "sizeBytes",
                  "asc" | "desc"
                ];
                onSortChange(sb, so);
              }}
              className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer"
            >
              <option value="createdAt-desc" className="bg-[#0D1421]">Newest first</option>
              <option value="createdAt-asc" className="bg-[#0D1421]">Oldest first</option>
              <option value="name-asc" className="bg-[#0D1421]">Name (A &rarr; Z)</option>
              <option value="name-desc" className="bg-[#0D1421]">Name (Z &rarr; A)</option>
              <option value="sizeBytes-desc" className="bg-[#0D1421]">Size (Largest)</option>
              <option value="sizeBytes-asc" className="bg-[#0D1421]">Size (Smallest)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-border bg-[#111B2B] p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-black font-semibold"
                  : "text-secondary-text hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "list"
                  ? "bg-primary text-black font-semibold"
                  : "text-secondary-text hover:text-foreground"
              )}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating / Active Bulk Selection Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-t border-primary/30 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={isAllSelected ? onClearSelection : onSelectAll}
                className="rounded border-border bg-[#111B2B] text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>{selectedCount} item{selectedCount > 1 ? "s" : ""} selected</span>
            </label>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-secondary-text hover:text-foreground underline text-[11px]"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentSection !== "trash" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDownload}
                  className="h-7 text-xs gap-1 border-border bg-[#0D1421] hover:border-primary/50"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkMove}
                  className="h-7 text-xs gap-1 border-border bg-[#0D1421] hover:border-primary/50"
                >
                  <FolderInput className="h-3 w-3 text-cyan-400" />
                  <span>Move</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDelete}
                  className="h-7 text-xs gap-1 border-red-500/30 bg-[#0D1421] text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkRestore}
                  className="h-7 text-xs gap-1 border-border bg-[#0D1421] text-emerald-400 hover:border-emerald-500/50"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Restore</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkPermanentDelete}
                  className="h-7 text-xs gap-1 border-red-500/30 bg-[#0D1421] text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Permanently</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
