"use client";

import React, { useState } from "react";
import { Folder as FolderIcon, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderDto, StoredFileDto } from "../types";

interface FileMoveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filesToMove: StoredFileDto[];
  folders: FolderDto[];
  onSuccess: () => void;
}

export function FileMoveModal({
  open,
  onOpenChange,
  filesToMove,
  folders,
  onSuccess,
}: FileMoveModalProps) {
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = filesToMove.length > 1;

  const handleMove = async () => {
    if (filesToMove.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      if (isBulk) {
        const res = await fetch("/api/files/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "move",
            fileIds: filesToMove.map((f) => f.id),
            targetFolderId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to move files");
      } else {
        const file = filesToMove[0];
        const res = await fetch(`/api/files/${file.id}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: targetFolderId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to move file");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={isBulk ? `Move ${filesToMove.length} files` : `Move "${filesToMove[0]?.originalName}"`}
      maxWidth="md"
    >
      <div className="space-y-4 my-2">
        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <p className="text-xs text-secondary-text">
          Select a destination folder:
        </p>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {/* Root Option */}
          <div
            onClick={() => setTargetFolderId(null)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              targetFolderId === null
                ? "border-primary bg-accent-subtle text-primary font-medium"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <FolderIcon className="h-4 w-4 text-primary shrink-0" />
            <span>Root (No folder)</span>
          </div>

          {/* Folder List */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setTargetFolderId(folder.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                targetFolderId === folder.id
                  ? "border-primary bg-accent-subtle text-primary font-medium"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <FolderIcon
                  className="h-4 w-4 shrink-0"
                  style={{ color: folder.color || "#00D4FF" }}
                />
                <span className="truncate">{folder.name}</span>
              </div>
              <span className="text-[10px] text-secondary-text font-mono">
                {folder.fileCount} files
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border bg-transparent text-secondary-text hover:text-foreground text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={loading}
            className="bg-primary text-black font-medium hover:bg-primary/90 text-xs gap-1.5"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Move Here</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
