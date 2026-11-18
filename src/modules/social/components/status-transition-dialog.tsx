"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { SocialPostDto, SocialPostStatus } from "../types";
import { PostStatusBadge } from "./social-badges";

interface StatusTransitionDialogProps {
  post: SocialPostDto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: SocialPostDto) => void;
}

const ALL_STATUSES: Array<{ value: SocialPostStatus; label: string; desc: string }> = [
  { value: "IDEA", label: "Idea", desc: "Brainstorming and early thoughts" },
  { value: "DRAFT", label: "Draft", desc: "Work in progress caption and creative" },
  { value: "IN_REVIEW", label: "In Review", desc: "Pending internal review or polish" },
  { value: "APPROVED", label: "Approved", desc: "Ready for scheduling" },
  { value: "SCHEDULED", label: "Scheduled", desc: "Assigned a planned publishing date/time" },
  { value: "PUBLISHED", label: "Published", desc: "Manually marked as published live" },
  { value: "CANCELLED", label: "Cancelled", desc: "Discarded or shelved" },
];

export function StatusTransitionDialog({
  post,
  open,
  onClose,
  onSuccess,
}: StatusTransitionDialogProps) {
  const [targetStatus, setTargetStatus] = useState<SocialPostStatus>("DRAFT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (post) {
      setTargetStatus(post.status);
      setNotes("");
      setError(null);
    }
  }, [post, open]);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/social/posts/${post.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      const data = await res.json();
      onSuccess(data.post);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isPublishing = targetStatus === "PUBLISHED";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Update Content Workflow Status"
      description={`Transition workflow status for "${post.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current -> Target Visualization */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card/60 border border-border/80">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-secondary-text uppercase tracking-wider font-semibold">
              Current
            </span>
            <PostStatusBadge status={post.status} />
          </div>
          <ArrowRight className="h-4 w-4 text-secondary-text" />
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[11px] text-secondary-text uppercase tracking-wider font-semibold">
              Target
            </span>
            <PostStatusBadge status={targetStatus} />
          </div>
        </div>

        {/* Target Status Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-secondary-text">New Status</label>
          <select
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value as SocialPostStatus)}
            className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {ALL_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label} — {st.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Publishing Alert */}
        {isPublishing && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Manual Publishing Confirmation:</strong> JARVIS is a content planner. Marking this post as Published records that you have published it live and marks scheduled reminders as completed.
            </div>
          </div>
        )}

        {/* Transition Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-secondary-text">Notes / Reason (optional)</label>
          <textarea
            placeholder="e.g., Reviewed by editor; ready for weekend publish"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[70px] resize-none"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || targetStatus === post.status}
            className="text-xs"
          >
            {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Confirm Transition
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
