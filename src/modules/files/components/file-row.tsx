"use client";

import React, { useState } from "react";
import {
  MoreVertical,
  Download,
  Eye,
  Pencil,
  FolderInput,
  Copy,
  Trash2,
  Info,
  RotateCcw,
  Folder as FolderIcon,
} from "lucide-react";
import { StoredFileDto } from "../types";
import { formatBytes } from "@/lib/storage/file-types";
import { FileCategoryIcon } from "./file-category-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileRowProps {
  file: StoredFileDto;
  selected: boolean;
  onToggleSelect: (fileId: string) => void;
  onPreview: (file: StoredFileDto) => void;
  onDownload: (file: StoredFileDto) => void;
  onRename: (file: StoredFileDto) => void;
  onMove: (file: StoredFileDto) => void;
  onCopy: (file: StoredFileDto) => void;
  onDelete: (file: StoredFileDto) => void;
  onRestore?: (file: StoredFileDto) => void;
  onPermanentDelete?: (file: StoredFileDto) => void;
  onViewDetails: (file: StoredFileDto) => void;
  isTrash?: boolean;
}

export function FileRow({
  file,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onRestore,
  onPermanentDelete,
  onViewDetails,
  isTrash = false,
}: FileRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formattedDate = new Date(file.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <tr
      className={cn(
        "group border-b border-border/60 text-xs transition-colors cursor-pointer select-none",
        selected
          ? "bg-primary/10 hover:bg-primary/15"
          : "hover:bg-muted/60"
      )}
      onClick={() => onPreview(file)}
    >
      {/* Checkbox */}
      <td
        className="w-10 px-3 py-2.5 text-center"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(file.id);
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          className="rounded border-border bg-card text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
        />
      </td>

      {/* Name & Icon */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCategoryIcon
            category={file.category}
            extension={file.extension}
            className="h-4 w-4 shrink-0"
          />
          <span
            className="font-medium text-foreground truncate hover:text-primary transition-colors max-w-xs md:max-w-md"
            title={file.originalName}
          >
            {file.originalName}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="px-3 py-2.5 hidden sm:table-cell">
        <Badge variant="outline" className="text-[10px] uppercase font-mono border-border bg-card">
          {file.category}
        </Badge>
      </td>

      {/* Size */}
      <td className="px-3 py-2.5 font-mono text-secondary-text whitespace-nowrap">
        {formatBytes(file.sizeBytes)}
      </td>

      {/* Folder */}
      <td className="px-3 py-2.5 hidden md:table-cell text-secondary-text">
        {file.folder ? (
          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
            <FolderIcon
              className="h-3 w-3 shrink-0"
              style={{ color: file.folder.color || "#00D4FF" }}
            />
            <span className="truncate">{file.folder.name}</span>
          </div>
        ) : (
          <span className="text-secondary-text/60 italic">&mdash;</span>
        )}
      </td>

      {/* Date */}
      <td className="px-3 py-2.5 hidden lg:table-cell text-secondary-text whitespace-nowrap">
        {formattedDate}
      </td>

      {/* Action Buttons */}
      <td className="px-3 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {!isTrash ? (
            <>
              <button
                type="button"
                onClick={() => onPreview(file)}
                className="p-1 rounded text-secondary-text hover:text-primary hover:bg-card-hover transition-colors"
                title="Preview"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDownload(file)}
                className="p-1 rounded text-secondary-text hover:text-primary hover:bg-card-hover transition-colors"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              {onRestore && (
                <button
                  type="button"
                  onClick={() => onRestore(file)}
                  className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Restore"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}

          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded text-secondary-text hover:text-foreground hover:bg-card-hover transition-colors"
              title="More options"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-6 z-30 w-44 rounded-xl border border-border bg-card p-1 shadow-dropdown text-xs text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {!isTrash ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onViewDetails(file);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-card-hover hover:text-primary transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>Details & Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onRename(file);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-card-hover transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-amber-400" />
                      <span>Rename</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMove(file);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-card-hover transition-colors"
                    >
                      <FolderInput className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Move to folder</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onCopy(file);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-card-hover transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-purple-400" />
                      <span>Make a copy</span>
                    </button>
                    <div className="my-1 border-t border-border/50" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(file);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Move to Trash</span>
                    </button>
                  </>
                ) : (
                  <>
                    {onRestore && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRestore(file);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore file</span>
                      </button>
                    )}
                    {onPermanentDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onPermanentDelete(file);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete permanently</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
