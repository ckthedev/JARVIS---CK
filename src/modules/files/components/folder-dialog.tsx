"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderDto } from "../types";
import { cn } from "@/lib/utils";

const FOLDER_COLORS = [
  "#00D4FF", // Cyan
  "#7A3FFF", // Purple
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#F43F5E", // Rose
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderToEdit?: FolderDto | null;
  parentFolderId?: string | null;
  folders: FolderDto[];
  onSuccess: () => void;
}

export function FolderDialog({
  open,
  onOpenChange,
  folderToEdit,
  parentFolderId,
  folders,
  onSuccess,
}: FolderDialogProps) {
  const isEditing = !!folderToEdit;
  const [name, setName] = useState("");
  const [color, setColor] = useState("#00D4FF");
  const [parentId, setParentId] = useState<string | null>(parentFolderId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (folderToEdit) {
        setName(folderToEdit.name);
        setColor(folderToEdit.color || "#00D4FF");
        setParentId(folderToEdit.parentId);
      } else {
        setName("");
        setColor("#00D4FF");
        setParentId(parentFolderId || null);
      }
      setError(null);
      setLoading(false);
    }
  }, [open, folderToEdit, parentFolderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const res = await fetch(`/api/files/folders/${folderToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), color, parentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update folder");
      } else {
        const res = await fetch("/api/files/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), color, parentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create folder");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const availableParents = folders.filter((f) => !folderToEdit || f.id !== folderToEdit.id);

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? "Edit Folder" : "New Folder"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 my-2">
        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="folder-name" className="text-xs text-secondary-text">
            Folder Name
          </Label>
          <Input
            id="folder-name"
            type="text"
            placeholder="e.g. Work Documents"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 bg-[#0D1421] border-border text-foreground text-xs focus:border-primary"
            autoFocus
            required
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-1.5">
          <Label className="text-xs text-secondary-text">Folder Color</Label>
          <div className="flex items-center gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full transition-transform",
                  color === c ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-[#0D1421]" : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Parent Folder */}
        <div className="space-y-1.5">
          <Label htmlFor="parent-folder" className="text-xs text-secondary-text">
            Location
          </Label>
          <select
            id="parent-folder"
            value={parentId || ""}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full bg-[#0D1421] text-foreground text-xs rounded border border-border px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Root (No parent)</option>
            {availableParents.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
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
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-primary text-black font-medium hover:bg-primary/90 text-xs gap-1.5"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>{isEditing ? "Save Changes" : "Create Folder"}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
