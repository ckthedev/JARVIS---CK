"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProjectDto } from "../types";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { Folder, Edit2, Trash2, Check, AlertCircle, Archive } from "lucide-react";

interface ProjectManagerModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectDto[];
  onRefresh: () => void;
}

const PRESET_COLORS = [
  "#00D4FF",
  "#7A3FFF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#8B5CF6",
  "#14B8A6",
];

export function ProjectManagerModal({
  open,
  onClose,
  projects,
  onRefresh,
}: ProjectManagerModalProps) {
  const { toast } = useToast();

  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED" | "COMPLETED">("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startCreate = () => {
    setEditingProject(null);
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[0]);
    setStatus("ACTIVE");
    setError(null);
  };

  const startEdit = (proj: ProjectDto) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || "");
    setColor(proj.color || PRESET_COLORS[0]);
    setStatus(proj.status as "ACTIVE" | "ARCHIVED" | "COMPLETED");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingProject
        ? `/api/tasks/projects/${editingProject.id}`
        : "/api/tasks/projects";
      const method = editingProject ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save project.");
        setLoading(false);
        return;
      }

      toast({
        title: editingProject ? "Project Updated" : "Project Created",
        description: `Project "${data.project.name}" has been saved.`,
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

  const handleArchiveToggle = async (proj: ProjectDto) => {
    const newStatus = proj.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
    try {
      const res = await fetch(`/api/tasks/projects/${proj.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({
          title: newStatus === "ARCHIVED" ? "Project Archived" : "Project Activated",
          description: `Project "${proj.name}" is now ${newStatus.toLowerCase()}.`,
          variant: "success",
        });
        onRefresh();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update project status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast({
          title: "Delete Failed",
          description: data.error || "Failed to delete project.",
          variant: "destructive",
        });
        setDeleting(false);
        return;
      }

      toast({
        title: "Project Deleted",
        description: `Project "${deleteTarget.name}" was removed. Tasks have been preserved.`,
        variant: "success",
      });

      setDeleteTarget(null);
      if (editingProject?.id === deleteTarget.id) {
        startCreate();
      }
      onRefresh();
    } catch {
      toast({
        title: "Error",
        description: "Network error occurred while deleting project.",
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
        title="Manage Projects"
        description="Organize tasks into structured initiatives, releases, or milestones."
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Create or Edit Form */}
          <div className="rounded-lg border border-[#292929] bg-[#181818] p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
              <Folder className="h-3.5 w-3.5 text-[#737373]" />
              {editingProject ? "Edit Project" : "Add New Project"}
            </h4>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-[#4A2020] bg-[#2A1818] p-2.5 text-xs text-[#EF4444]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="proj-name">Project Name</Label>
                <Input
                  id="proj-name"
                  placeholder="e.g. JARVIS Core v2.0"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="proj-desc">Description</Label>
                <Input
                  id="proj-desc"
                  placeholder="Brief summary of project goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "ARCHIVED" | "COMPLETED")}
                    className="flex h-9 w-full rounded-lg border border-[#303030] bg-[#181818] px-3 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#454545] transition-colors"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Color Tag</Label>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="h-5 w-5 rounded-full border border-white/20 transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      >
                        {color === c && (
                          <Check className="h-3.5 w-3.5 text-black stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingProject && (
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
                  {editingProject ? "Update Project" : "Add Project"}
                </Button>
              </div>
            </form>
          </div>

          {/* Existing Projects List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
              Active &amp; Archived Projects ({projects.length})
            </h4>

            {projects.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#737373]">
                No projects created yet. Add your first project above.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-[#292929] rounded-lg border border-[#292929] bg-[#181818]">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex items-center justify-between p-3 transition-colors hover:bg-sidebar-accent/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || "#00D4FF" }}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground truncate">
                            {proj.name}
                          </span>
                          <Badge
                            variant={proj.status === "ACTIVE" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {proj.status}
                          </Badge>
                        </div>
                        {proj.description && (
                          <p className="text-[11px] text-secondary-text truncate">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-secondary-text mr-1">
                        {proj.taskCount ?? 0} {proj.taskCount === 1 ? "task" : "tasks"}
                      </span>
                      <button
                        onClick={() => handleArchiveToggle(proj)}
                        className="rounded p-1 text-secondary-text hover:text-amber-400 transition-colors"
                        title={proj.status === "ARCHIVED" ? "Unarchive" : "Archive"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(proj)}
                        className="rounded p-1 text-secondary-text hover:text-primary transition-colors"
                        title="Edit project"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(proj)}
                        className="rounded p-1 text-secondary-text hover:text-red-400 transition-colors"
                        title="Delete project"
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
        title="Delete Project"
        description={`Are you sure you want to delete the project "${deleteTarget?.name}"? Associated tasks will be preserved with their project set to none.`}
        confirmText="Delete Project"
        isLoading={deleting}
      />
    </>
  );
}
