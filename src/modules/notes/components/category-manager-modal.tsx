"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { NoteCategoryDto } from "../types";
import { Edit2, Trash2, Check, AlertCircle, Plus } from "lucide-react";

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  categories: NoteCategoryDto[];
  onRefresh: () => void;
}

const PRESET_COLORS = [
  "#00D4FF", // Cyan (Primary)
  "#7A3FFF", // Purple (Secondary)
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#E11D48", // Rose
  "#8B5CF6", // Violet
];

export function CategoryManagerModal({
  open,
  onClose,
  categories,
  onRefresh,
}: CategoryManagerModalProps) {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
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
      const res = await fetch("/api/notes/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      toast({
        title: "Category Created",
        description: `"${data.category.name}" has been created.`,
      });

      setNewName("");
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (category: NoteCategoryDto) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color || PRESET_COLORS[0]);
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/notes/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      toast({
        title: "Category Updated",
        description: `Category renamed to "${data.category.name}".`,
      });

      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/notes/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }

      toast({
        title: "Category Deleted",
        description: "Category deleted. All notes were preserved.",
      });

      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete category";
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
    <Dialog open={open} onClose={onClose} title="Manage Note Categories" maxWidth="lg">
      <div className="space-y-6">
        {/* Create Category Form */}
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-[#292929] bg-[#181818] p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Create New Category
          </Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Architecture, Research, Sprint Notes"
              className="flex-1 bg-[#141414] border-[#303030] text-[#F5F5F5] text-sm"
              disabled={submitting}
            />
            <Button type="submit" size="sm" disabled={submitting || !newName.trim()} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[#A3A3A3]">Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className="h-5 w-5 rounded-full transition-transform hover:scale-110 flex items-center justify-center border border-white/20"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {newColor === color && <Check className="h-3 w-3 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Categories ({categories.length})
          </Label>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {categories.length === 0 ? (
              <p className="text-xs text-[#737373] py-4 text-center">No categories created yet.</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-md border border-[#292929] bg-[#181818] p-2.5 transition-colors hover:border-[#383838]"
                >
                  {editingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2 mr-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-xs bg-[#141414] border-[#303030] text-[#F5F5F5]"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.slice(0, 5).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(cat.id)}
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
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: cat.color || "#888888" }}
                        />
                        <span className="text-sm font-medium text-[#F5F5F5] truncate">{cat.name}</span>
                        <span className="rounded bg-[#202020] border border-[#292929] px-2 py-0.5 text-[10px] text-[#A3A3A3]">
                          {cat.noteCount ?? 0} notes
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {deleteConfirmId === cat.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-red-400 mr-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Preserve notes?
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(cat.id)}
                              className="h-7 px-2 text-xs"
                              disabled={submitting}
                            >
                              Delete
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
                              onClick={() => handleStartEdit(cat)}
                              className="rounded p-1 text-secondary-text hover:text-foreground hover:bg-card-hover"
                              title="Rename category"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="rounded p-1 text-secondary-text hover:text-red-400 hover:bg-card-hover"
                              title="Delete category"
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

        {/* Note on preservation */}
        <p className="text-[11px] text-secondary-text/80 bg-sidebar-accent/50 p-2.5 rounded border border-border">
          <strong>Note:</strong> Deleting a category never deletes your notes. Any notes assigned to a deleted category
          will automatically have their category set to unassigned.
        </p>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
