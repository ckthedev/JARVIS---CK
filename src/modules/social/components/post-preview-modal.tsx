"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ThumbsUp,
  Share2,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { SocialPostDto, SocialPlatform } from "../types";
import { PlatformIcon, getPlatformMeta, PostStatusBadge, PriorityBadge } from "./social-badges";
import { cn } from "@/lib/utils";

interface PostPreviewModalProps {
  post: SocialPostDto | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (post: SocialPostDto) => void;
}

export function PostPreviewModal({
  post,
  open,
  onClose,
  onEdit,
}: PostPreviewModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("INSTAGRAM");

  React.useEffect(() => {
    if (post && post.platforms && post.platforms.length > 0) {
      setSelectedPlatform(post.platforms[0].platform);
    } else {
      setSelectedPlatform("INSTAGRAM");
    }
  }, [post, open]);

  if (!post) return null;

  const currentVariant = post.platforms?.find((p) => p.platform === selectedPlatform);
  const caption = currentVariant?.caption || post.content || "No caption written yet.";
  const meta = getPlatformMeta(selectedPlatform);

  const renderFormattedCaption = (text: string) => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (token.startsWith("#")) {
        return (
          <span key={i} className="text-primary font-medium">
            {token}
          </span>
        );
      }
      if (token.startsWith("http://") || token.startsWith("https://")) {
        return (
          <span key={i} className="text-cyan-400 underline break-all">
            {token}
          </span>
        );
      }
      return token;
    });
  };

  const primaryMedia = post.media && post.media.length > 0 ? post.media[0] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Content Preview"
      description={`"${post.title}" • ${post.status}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Top Badges & Edit Button */}
        <div className="flex items-center justify-between pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <PostStatusBadge status={post.status} />
            <PriorityBadge priority={post.priority} />
          </div>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(post);
              }}
              className="h-8 text-xs"
            >
              Edit Post
            </Button>
          )}
        </div>

        {/* Platform Switcher Tabs */}
        {post.platforms && post.platforms.length > 0 && (
          <div className="flex items-center gap-1 border-b border-border/60 overflow-x-auto pb-1">
            {post.platforms.map((p) => {
              const pMeta = getPlatformMeta(p.platform);
              const isSelected = selectedPlatform === p.platform;
              return (
                <button
                  key={p.platform}
                  type="button"
                  onClick={() => setSelectedPlatform(p.platform)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 border-b-2 text-xs font-medium transition-all",
                    isSelected
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-secondary-text hover:text-foreground"
                  )}
                >
                  <PlatformIcon platform={p.platform} className="h-3.5 w-3.5" />
                  <span>{pMeta.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Preview Container */}
        <div className="p-4 bg-[#060A12] rounded-xl flex items-center justify-center min-h-[380px]">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0c1320] overflow-hidden shadow-2xl">
            {/* Mock Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  J
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">JARVIS Official</span>
                    <span className="text-[10px] text-secondary-text">&bull; 1h</span>
                  </div>
                  <span className="text-[10px] text-secondary-text flex items-center gap-1">
                    <PlatformIcon platform={selectedPlatform} className="h-2.5 w-2.5 text-secondary-text" />
                    {meta.label} Preview
                  </span>
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-secondary-text cursor-pointer" />
            </div>

            {/* Media Attachment Mock */}
            {primaryMedia ? (
              <div className="relative aspect-video w-full bg-black/40 flex items-center justify-center overflow-hidden border-y border-white/[0.04]">
                {primaryMedia.file && primaryMedia.file.mimeType.startsWith("image/") ? (
                  <img
                    src={`/api/files/${primaryMedia.fileId}/preview`}
                    alt="Post media"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-secondary-text gap-2">
                    <PlatformIcon platform={selectedPlatform} className="h-10 w-10 text-primary/70" />
                    <span className="text-xs font-medium text-foreground/80">
                      {primaryMedia.file?.originalName || "Attached Media File"}
                    </span>
                  </div>
                )}
                {post.media && post.media.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono">
                    1 / {post.media.length}
                  </div>
                )}
              </div>
            ) : null}

            {/* Mock YouTube Title if applicable */}
            {selectedPlatform === "YOUTUBE" && currentVariant?.title && (
              <div className="p-3 pb-1 border-b border-white/[0.04]">
                <h3 className="text-xs font-bold text-foreground leading-snug">
                  {currentVariant.title}
                </h3>
              </div>
            )}

            {/* Caption & Content */}
            <div className="p-3 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[160px] overflow-y-auto">
              {renderFormattedCaption(caption)}
            </div>

            {/* Mock Social Interactions Bar */}
            <div className="px-3 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-secondary-text">
              <div className="flex items-center gap-4">
                {selectedPlatform === "FACEBOOK" || selectedPlatform === "LINKEDIN" ? (
                  <button type="button" className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                    <ThumbsUp className="h-4 w-4" /> Like
                  </button>
                ) : (
                  <button type="button" className="hover:text-red-400 transition-colors">
                    <Heart className="h-4 w-4" />
                  </button>
                )}
                <button type="button" className="hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button type="button" className="hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <Bookmark className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs text-secondary-text">
          <div className="flex items-center gap-3">
            {post.plannedAt && (
              <span className="flex items-center gap-1.5 text-foreground/80">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Planned: {new Date(post.plannedAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })} IST
              </span>
            )}
            {post.campaign && (
              <span className="text-purple-400 font-medium">
                Campaign: {post.campaign.name}
              </span>
            )}
          </div>
          <span className="text-[11px]">
            {caption.length} / {meta.charLimit} chars
          </span>
        </div>
      </div>
    </Dialog>
  );
}
