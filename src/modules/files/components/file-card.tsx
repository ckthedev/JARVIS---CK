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
import { cn } from "@/lib/utils";

interface FileCardProps {
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

export function FileCard({
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
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = file.category === "IMAGE" && file.extension?.toLowerCase() !== "svg";
  const formattedDate = new Date(file.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border bg-card p-3 transition-all duration-200 select-none shadow-saas",
        selected
          ? "border-primary ring-1 ring-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-cardHover"
      )}
      onClick={() => onPreview(file)}
    >
      {/* Top Header: Checkbox + Actions */}
      <div className="flex items-center justify-between mb-2">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(file.id);
          }}
          className={cn(
            "p-1 rounded cursor-pointer transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}} // Controlled by parent div click
            className="rounded border-border bg-card text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
          />
        </div>

        {/* Options Menu Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={cn(
              "rounded p-1 text-secondary-text hover:text-foreground hover:bg-muted transition-opacity",
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            title="File options"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {/* Options Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-30 w-44 rounded-xl border border-border bg-card p-1 shadow-dropdown text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {!isTrash ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onPreview(file);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-card-hover hover:text-primary transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDownload(file);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-card-hover hover:text-primary transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onViewDetails(file);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-card-hover hover:text-primary transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>Details & Info</span>
                  </button>

                  <div className="my-1 border-t border-border/50" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onRename(file);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-card-hover transition-colors"
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
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-card-hover transition-colors"
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
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-card-hover transition-colors"
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
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-red-400 hover:bg-red-500/10 transition-colors"
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
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-emerald-400 hover:bg-emerald-500/10 transition-colors"
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
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-red-400 hover:bg-red-500/10 transition-colors"
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

      {/* Center Media / Icon Preview Area */}
      <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-muted/60 p-2 my-1">
        {isImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${file.id}/preview`}
            alt={file.originalName}
            onError={() => setImageError(true)}
            className="h-full w-full object-contain rounded"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <FileCategoryIcon
              category={file.category}
              extension={file.extension}
              className="h-10 w-10"
            />
            {file.extension && (
              <span className="text-[10px] uppercase font-mono tracking-wider text-secondary-text">
                {file.extension}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Info: Filename, size, folder, date */}
      <div className="mt-2 space-y-1">
        <h4
          className="text-xs font-medium text-foreground truncate hover:text-primary transition-colors"
          title={file.originalName}
        >
          {file.originalName}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-secondary-text">
          <span className="font-mono">{formatBytes(file.sizeBytes)}</span>
          <span>{formattedDate}</span>
        </div>

        {file.folder && (
          <div className="flex items-center gap-1 text-[10px] text-secondary-text/80 truncate">
            <FolderIcon
              className="h-2.5 w-2.5 shrink-0"
              style={{ color: file.folder.color || "#00D4FF" }}
            />
            <span className="truncate">{file.folder.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
