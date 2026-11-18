"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { NoteTagDto } from "../types";
import { Edit2, Trash2, Check, Plus } from "lucide-react";

interface TagManagerModalProps {
  open: boolean;
  onClose: () => void;
  tags: NoteTagDto[];
  onRefresh: () => void;
}

const PRESET_TAG_COLORS = [
  "#7A3FFF", // Purple
  "#00D4FF", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#E11D48", // Rose
];

export function TagManagerModal({
  open,
  onClose,
  tags,
  onRefresh,
}: TagManagerModalProps) {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/notes/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create tag");
      }

      toast({
        title: "Tag Created",
        description: `#${data.tag.name} has been added.`,
      });

      setNewName("");
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create tag";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (tag: NoteTagDto) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color || PRESET_TAG_COLORS[0]);
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/notes/tags/${tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update tag");
      }

      toast({
        title: "Tag Updated",
        description: `Tag renamed to #${data.tag.name}.`,
      });

      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update tag";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/notes/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete tag");
      }

      toast({
        title: "Tag Removed",
        description: "Tag deleted and unassigned from all notes.",
      });

      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete tag";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Manage Tags" maxWidth="md">
      <div className="space-y-6">
        {/* Create Tag Form */}
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-border bg-[#0A101C] p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
            Add New Tag
          </Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. backend, meeting, priority"
              className="flex-1 bg-[#111B2B] border-border text-sm"
              disabled={submitting}
            />
            <Button type="submit" size="sm" disabled={submitting || !newName.trim()} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-secondary-text">Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className="h-4 w-4 rounded-full transition-transform hover:scale-110 flex items-center justify-center border border-white/20"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {newColor === color && <Check className="h-2.5 w-2.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Tags List */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
            Existing Tags ({tags.length})
          </Label>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {tags.length === 0 ? (
              <p className="text-xs text-secondary-text py-4 text-center">No tags created yet.</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-md border border-border bg-[#0A101C] p-2.5 transition-colors hover:border-border/80"
                >
                  {editingId === tag.id ? (
                    <div className="flex-1 flex items-center gap-2 mr-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-xs bg-[#111B2B]"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(tag.id)}
                        disabled={submitting}
                        className="h-8 px-2 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="h-8 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || "#7A3FFF" }}
                        />
                        <span className="text-xs font-medium text-foreground truncate">#{tag.name}</span>
                        <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-secondary-text">
                          {tag.noteCount ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {deleteConfirmId === tag.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(tag.id)}
                              className="h-7 px-2 text-xs"
                              disabled={submitting}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirmId(null)}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(tag)}
                              className="rounded p-1 text-secondary-text hover:text-foreground hover:bg-card-hover"
                              title="Rename tag"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(tag.id)}
                              className="rounded p-1 text-secondary-text hover:text-red-400 hover:bg-card-hover"
                              title="Delete tag"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
