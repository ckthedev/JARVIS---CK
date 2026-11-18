"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderDto } from "../types";

interface FolderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderDto | null;
  onSuccess: () => void;
}

export function FolderDeleteDialog({
  open,
  onOpenChange,
  folder,
  onSuccess,
}: FolderDeleteDialogProps) {
  const [action, setAction] = useState<"move_to_parent" | "trash_all">("move_to_parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!folder) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/folders/${folder.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete folder");

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
      title={`Delete Folder "${folder.name}"`}
      maxWidth="md"
    >
      <div className="space-y-4 my-2">
        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <p className="text-xs text-secondary-text">
          This folder contains <span className="font-medium text-foreground">{folder.fileCount}</span> files
          and <span className="font-medium text-foreground">{folder.subfolderCount}</span> subfolders.
          Please choose what to do with its contents:
        </p>

        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-[#0D1421] cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="radio"
              name="deletePolicy"
              value="move_to_parent"
              checked={action === "move_to_parent"}
              onChange={() => setAction("move_to_parent")}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="space-y-0.5 text-xs">
              <span className="font-medium text-foreground block">
                Move contents to parent folder (Recommended)
              </span>
              <span className="text-secondary-text block">
                The folder itself is deleted, but all files and subfolders are safely moved up to the parent directory.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-[#0D1421] cursor-pointer hover:border-red-500/50 transition-colors">
            <input
              type="radio"
              name="deletePolicy"
              value="trash_all"
              checked={action === "trash_all"}
              onChange={() => setAction("trash_all")}
              className="mt-0.5 text-red-500 focus:ring-red-500"
            />
            <div className="space-y-0.5 text-xs">
              <span className="font-medium text-red-400 block">
                Move folder and all contents to trash
              </span>
              <span className="text-secondary-text block">
                Soft-deletes this folder and moves all files inside to the Trash section.
              </span>
            </div>
          </label>
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
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-500 text-white font-medium hover:bg-red-600 text-xs gap-1.5"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Confirm Delete</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
