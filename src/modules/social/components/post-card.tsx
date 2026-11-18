"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MoreVertical,
  Eye,
  Edit2,
  Copy,
  Trash2,
  ArrowRightCircle,
  Megaphone,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialPostDto } from "../types";
import {
  PlatformBadge,
  PostStatusBadge,
  PriorityBadge,
  ContentPillarBadge,
} from "./social-badges";

interface PostCardProps {
  post: SocialPostDto;
  onPreview: (post: SocialPostDto) => void;
  onEdit: (post: SocialPostDto) => void;
  onStatusChange: (post: SocialPostDto) => void;
  onReschedule: (post: SocialPostDto) => void;
  onDuplicate: (post: SocialPostDto) => void;
  onDelete: (postId: string) => void;
}

export function PostCard({
  post,
  onPreview,
  onEdit,
  onStatusChange,
  onReschedule,
  onDuplicate,
  onDelete,
}: PostCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryMedia = post.media && post.media.length > 0 ? post.media[0] : null;

  const formattedPlannedDate = post.plannedAt
    ? new Date(post.plannedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (confirm(`Are you sure you want to delete post "${post.title}"?`)) {
      setDeleting(true);
      try {
        await onDelete(post.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div
      onClick={() => onPreview(post)}
      className="group relative rounded-xl border border-white/[0.08] bg-[#0c1320] p-4 hover:border-white/[0.18] transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:shadow-black/40"
    >
      {/* Top Bar: Platforms, Status & Actions Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {post.platforms && post.platforms.length > 0 ? (
            post.platforms.map((p) => (
              <PlatformBadge key={p.platform} platform={p.platform} />
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground italic">No platforms</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 relative" onClick={(e) => e.stopPropagation()}>
          <PostStatusBadge status={post.status} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-lg bg-[#0F172A] border border-border/80 shadow-xl py-1 text-xs text-foreground divide-y divide-white/[0.06]">
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onPreview(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" /> View Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-blue-400" /> Edit Post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onStatusChange(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5 text-amber-400" /> Change Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReschedule(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-purple-400" /> Duplicate
                  </button>
                </div>
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-left transition-colors"
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete Post
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle Content: Title, Snippet & Media Thumbnail */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {post.title}
            </h3>
            <PriorityBadge priority={post.priority} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {post.content || post.description || "No content snippet written."}
          </p>
        </div>

        {primaryMedia && (
          <div className="h-16 w-16 rounded-lg bg-black/40 border border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center">
            {primaryMedia.file && primaryMedia.file.mimeType.startsWith("image/") ? (
              <img
                src={`/api/files/${primaryMedia.fileId}/preview`}
                alt="thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
            )}
          </div>
        )}
      </div>

      {/* Bottom Row: Pillar, Campaign, Schedule */}
      <div className="pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {post.contentPillar && (
            <ContentPillarBadge pillar={post.contentPillar} />
          )}
          {post.campaign && (
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              <Megaphone className="h-2.5 w-2.5" />
              <span className="truncate max-w-[120px]">{post.campaign.name}</span>
            </span>
          )}
        </div>

        {formattedPlannedDate ? (
          <div className="flex items-center gap-1.5 text-foreground/80 font-mono text-[11px] bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>{formattedPlannedDate} IST</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 italic">Unscheduled</span>
        )}
      </div>
    </div>
  );
}
