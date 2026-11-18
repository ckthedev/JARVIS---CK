"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TaskCategoryDto } from "../types";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { Tag, Edit2, Trash2, Check, AlertCircle } from "lucide-react";

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  categories: TaskCategoryDto[];
  onRefresh: () => void;
}

const PRESET_COLORS = [
  "#00D4FF", // Cyan (Primary)
  "#7A3FFF", // Purple (Secondary)
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
  "#64748B", // Slate
];

export function CategoryManagerModal({
  open,
  onClose,
  categories,
  onRefresh,
}: CategoryManagerModalProps) {
  const { toast } = useToast();

  const [editingCategory, setEditingCategory] = useState<TaskCategoryDto | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<TaskCategoryDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startCreate = () => {
    setEditingCategory(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setError(null);
  };

  const startEdit = (cat: TaskCategoryDto) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || PRESET_COLORS[0]);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingCategory
        ? `/api/tasks/categories/${editingCategory.id}`
        : "/api/tasks/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save category.");
        setLoading(false);
        return;
      }

      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: `Category "${data.category.name}" has been saved.`,
        variant: "success",
      });

      startCreate();
      onRefresh();
    } catch {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast({
          title: "Delete Failed",
          description: data.error || "Failed to delete category.",
          variant: "destructive",
        });
        setDeleting(false);
        return;
      }

      toast({
        title: "Category Deleted",
        description: `Category "${deleteTarget.name}" was removed. Tasks have been preserved.`,
        variant: "success",
      });

      setDeleteTarget(null);
      if (editingCategory?.id === deleteTarget.id) {
        startCreate();
      }
      onRefresh();
    } catch {
      toast({
        title: "Error",
        description: "Network error occurred while deleting category.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Manage Task Categories"
        description="Organize your tasks by domain, context, or workflow tags."
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Create or Edit Form */}
          <div className="rounded-lg border border-border/80 bg-[#0A101C] p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h4>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Work, Infrastructure, Personal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Color Picker Palette */}
              <div className="space-y-1.5">
                <Label>Accent Color</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="h-6 w-6 rounded-full border border-white/20 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    >
                      {color === c && (
                        <Check className="h-3.5 w-3.5 text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded-full border border-border bg-transparent p-0"
                    title="Custom Hex Color"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingCategory && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={startCreate}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" size="sm" isLoading={loading}>
                  {editingCategory ? "Update Category" : "Add Category"}
                </Button>
              </div>
            </form>
          </div>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
              Active Categories ({categories.length})
            </h4>

            {categories.length === 0 ? (
              <p className="py-4 text-center text-xs text-secondary-text">
                No categories created yet. Add your first category above.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-border/40 rounded-md border border-border bg-[#0A101C]">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 transition-colors hover:bg-sidebar-accent/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#00D4FF" }}
                      />
                      <span className="text-xs font-medium text-foreground">
                        {cat.name}
                      </span>
                      <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-secondary-text">
                        {cat.taskCount ?? 0} {cat.taskCount === 1 ? "task" : "tasks"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="rounded p-1 text-secondary-text hover:text-primary transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="rounded p-1 text-secondary-text hover:text-red-400 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={`Are you sure you want to delete the category "${deleteTarget?.name}"? Any assigned tasks will be preserved with their category set to none.`}
        confirmText="Delete Category"
        isLoading={deleting}
      />
    </>
  );
}
