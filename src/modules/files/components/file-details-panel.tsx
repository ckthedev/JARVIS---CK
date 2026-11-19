"use client";

import React, { useState } from "react";
import {
  Download,
  Pencil,
  FolderInput,
  Trash2,
  Calendar,
  Clock,
  HardDrive,
  Hash,
  Folder as FolderIcon,
  Check,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoredFileDto } from "../types";
import { formatBytes } from "@/lib/storage/file-types";
import { FileCategoryIcon } from "./file-category-icon";

interface FileDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: StoredFileDto | null;
  onDownload: (file: StoredFileDto) => void;
  onRename: (file: StoredFileDto) => void;
  onMove: (file: StoredFileDto) => void;
  onDelete: (file: StoredFileDto) => void;
}

export function FileDetailsPanel({
  open,
  onOpenChange,
  file,
  onDownload,
  onRename,
  onMove,
  onDelete,
}: FileDetailsPanelProps) {
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  if (!file) return null;

  const handleCopyChecksum = () => {
    if (file.checksum) {
      navigator.clipboard.writeText(file.checksum);
      setCopiedChecksum(true);
      setTimeout(() => setCopiedChecksum(false), 2000);
    }
  };

  const createdDate = new Date(file.createdAt).toLocaleString();
  const lastAccessedDate = file.lastAccessedAt
    ? new Date(file.lastAccessedAt).toLocaleString()
    : "Never accessed";

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="File Details"
      maxWidth="md"
    >
      <div className="space-y-4 my-2">
        {/* File Card Header */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border">
          <div className="p-2.5 rounded-lg bg-card border border-border shrink-0">
            <FileCategoryIcon category={file.category} extension={file.extension} className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-foreground truncate" title={file.originalName}>
              {file.originalName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase font-mono border-border bg-card">
                {file.category}
              </Badge>
              <span className="text-[11px] font-mono text-secondary-text">
                {formatBytes(file.sizeBytes)}
              </span>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-secondary-text flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              Exact Size
            </span>
            <span className="font-mono text-foreground">{file.sizeBytes.toLocaleString()} bytes</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-secondary-text">MIME Type</span>
            <span className="font-mono text-foreground truncate max-w-[200px]" title={file.mimeType}>
              {file.mimeType}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-secondary-text flex items-center gap-1.5">
              <FolderIcon className="h-3.5 w-3.5" />
              Location
            </span>
            <span className="text-foreground">
              {file.folder ? file.folder.name : "Root Directory"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-secondary-text flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Uploaded
            </span>
            <span className="text-foreground">{createdDate}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-secondary-text flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last Accessed
            </span>
            <span className="text-foreground">{lastAccessedDate}</span>
          </div>

          {file.checksum && (
            <div className="flex flex-col gap-1 py-1.5 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-secondary-text flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  SHA-256 Checksum
                </span>
                <button
                  type="button"
                  onClick={handleCopyChecksum}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {copiedChecksum ? (
                    <>
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
              <div className="font-mono text-[10px] text-secondary-text/80 break-all bg-muted/60 p-1.5 rounded border border-border">
                {file.checksum}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onDownload(file);
            }}
            className="text-xs gap-1.5 border-border bg-card hover:border-primary/50"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Download</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onRename(file);
            }}
            className="text-xs gap-1.5 border-border bg-card hover:border-primary/50"
          >
            <Pencil className="h-3.5 w-3.5 text-warning" />
            <span>Rename</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onMove(file);
            }}
            className="text-xs gap-1.5 border-border bg-card hover:border-primary/50"
          >
            <FolderInput className="h-3.5 w-3.5 text-secondary" />
            <span>Move</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onDelete(file);
            }}
            className="text-xs gap-1.5 border-danger/30 bg-card text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Move to Trash</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
