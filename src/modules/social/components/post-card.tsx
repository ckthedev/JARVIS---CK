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
      onDelete(post.id);
    }
  };

  return (
    <div
      onClick={() => onPreview(post)}
      className="group relative rounded-xl border border-[#303030] bg-[#202020] p-4 hover:border-[#3C3C3C] hover:bg-[#242424] transition-colors cursor-pointer flex flex-col justify-between gap-3 shadow-sm"
    >
      {/* Top Bar: Platforms, Status & Actions Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {post.platforms && post.platforms.length > 0 ? (
            post.platforms.map((p) => (
              <PlatformBadge key={p.platform} platform={p.platform} />
            ))
          ) : (
            <span className="text-[11px] text-[#737373] italic">No platforms</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 relative" onClick={(e) => e.stopPropagation()}>
          <PostStatusBadge status={post.status} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-7 w-7 p-0 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#262626]"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-lg bg-[#262626] border border-[#303030] shadow-xl py-1 text-xs text-[#F5F5F5] divide-y divide-[#303030]">
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onPreview(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2C2C2C] text-left transition-colors text-[#F5F5F5]"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#8B5CF6]" /> View Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2C2C2C] text-left transition-colors text-[#F5F5F5]"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-[#3B82F6]" /> Edit Post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onStatusChange(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2C2C2C] text-left transition-colors text-[#F5F5F5]"
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5 text-[#F59E0B]" /> Change Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReschedule(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2C2C2C] text-left transition-colors text-[#F5F5F5]"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#EC4899]" /> Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(post);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2C2C2C] text-left transition-colors text-[#F5F5F5]"
                  >
                    <Copy className="h-3.5 w-3.5 text-[#A3A3A3]" /> Duplicate
                  </button>
                </div>
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#EF4444]/15 text-[#EF4444] text-left transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Post
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media Preview Box if attached */}
      {primaryMedia && (
        <div className="h-28 w-full rounded-lg bg-[#181818] border border-[#303030] flex items-center justify-center overflow-hidden">
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            <ImageIcon className="h-4 w-4 text-[#8B5CF6]" />
            <span className="truncate max-w-[200px] font-medium">
              {primaryMedia.file?.originalName || "Attached Media Asset"}
            </span>
          </div>
        </div>
      )}

      {/* Title & Caption snippet */}
      <div className="space-y-1">
        <h3 className="font-semibold text-sm text-[#F5F5F5] group-hover:text-[#8B5CF6] transition-colors line-clamp-1">
          {post.title}
        </h3>
        <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
          {post.content || post.description || "No caption added."}
        </p>
      </div>

      {/* Campaign & Pillar Badges */}
      {(post.campaign || post.contentPillar) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {post.campaign && (
            <span className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#303030] px-2 py-0.5 text-[10px] text-[#A3A3A3]">
              <Megaphone className="h-2.5 w-2.5 text-[#F59E0B]" />
              {post.campaign.name}
            </span>
          )}
          {post.contentPillar && (
            <ContentPillarBadge pillar={post.contentPillar} />
          )}
        </div>
      )}

      {/* Footer: Priority, Schedule Time, Timezone */}
      <div className="flex items-center justify-between border-t border-[#303030] pt-2.5 text-[11px] text-[#737373]">
        <PriorityBadge priority={post.priority} />

        {formattedPlannedDate ? (
          <div className="flex items-center gap-1 text-[#A3A3A3] font-mono">
            <Clock className="h-3 w-3 text-[#EC4899]" />
            <span>{formattedPlannedDate} IST</span>
          </div>
        ) : (
          <span className="italic text-[#737373]">Unscheduled</span>
        )}
      </div>
    </div>
  );
}
