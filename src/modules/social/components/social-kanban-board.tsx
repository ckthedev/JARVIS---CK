"use client";

import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Clock,
  Megaphone,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { SocialPostDto, SocialPostStatus } from "../types";
import { PlatformBadge, PriorityBadge } from "./social-badges";
import { DarkConfirmationDialog } from "@/components/dark-workspace/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SocialKanbanBoardProps {
  posts: SocialPostDto[];
  onStatusChange: (post: SocialPostDto, newStatus: SocialPostStatus) => Promise<boolean>;
  onPreview: (post: SocialPostDto) => void;
  onEdit?: (post: SocialPostDto) => void;
  onReschedule?: (post: SocialPostDto) => void;
  onDuplicate?: (post: SocialPostDto) => void;
  onDelete?: (postId: string) => void;
  onCreateInColumn: (status: SocialPostStatus) => void;
}

const COLUMNS: { id: SocialPostStatus; label: string; color: string }[] = [
  { id: "IDEA", label: "Ideas", color: "#737373" },
  { id: "DRAFT", label: "Drafts", color: "#3B82F6" },
  { id: "IN_REVIEW", label: "In Review", color: "#F59E0B" },
  { id: "APPROVED", label: "Approved", color: "#8B5CF6" },
  { id: "SCHEDULED", label: "Scheduled", color: "#EC4899" },
  { id: "PUBLISHED", label: "Published", color: "#22C55E" },
];

export function SocialKanbanBoard({
  posts,
  onStatusChange,
  onPreview,
  onCreateInColumn,
}: SocialKanbanBoardProps) {
  const { toast } = useToast();
  const [movingPostId, setMovingPostId] = useState<string | null>(null);

  // Manual Publish Confirmation Modal
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [pendingPublishPost, setPendingPublishPost] = useState<SocialPostDto | null>(null);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as SocialPostStatus;
    const post = posts.find((p) => p.id === draggableId);
    if (!post) return;

    // Requirement: Published status must ONLY be assigned after manual confirmation
    if (newStatus === "PUBLISHED") {
      setPendingPublishPost(post);
      setPublishConfirmOpen(true);
      return;
    }

    setMovingPostId(draggableId);
    const success = await onStatusChange(post, newStatus);
    setMovingPostId(null);

    if (!success) {
      toast({
        title: "Update Failed",
        description: "Could not update post workflow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPublish = async () => {
    if (!pendingPublishPost) return;
    setPublishConfirmOpen(false);

    setMovingPostId(pendingPublishPost.id);
    const success = await onStatusChange(pendingPublishPost, "PUBLISHED");
    setMovingPostId(null);
    setPendingPublishPost(null);

    if (success) {
      toast({
        title: "Content Published",
        description: `"${pendingPublishPost.title}" was marked as published.`,
      });
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {COLUMNS.map((col) => {
            const colPosts = posts.filter((p) => p.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-xl border border-[#303030] bg-[#202020] p-3 min-h-[550px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#303030]">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                      {col.label}
                    </h3>
                    <span className="rounded bg-[#262626] border border-[#303030] px-1.5 py-0.2 text-[10px] font-semibold text-[#A3A3A3]">
                      {colPosts.length}
                    </span>
                  </div>

                  {col.id !== "PUBLISHED" && (
                    <button
                      type="button"
                      onClick={() => onCreateInColumn(col.id)}
                      className="rounded p-1 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#262626] transition-colors"
                      title={`Add to ${col.label}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Droppable Container */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 py-2.5 space-y-2.5 transition-colors",
                        snapshot.isDraggingOver ? "bg-[#262626]/40 rounded-lg" : ""
                      )}
                    >
                      {colPosts.length === 0 && !snapshot.isDraggingOver && (
                        <div className="py-10 text-center text-[11px] text-[#555555]">
                          No posts
                        </div>
                      )}

                      {colPosts.map((post, index) => {
                        const isUpdating = movingPostId === post.id;
                        const primaryMedia = post.media?.[0];

                        return (
                          <Draggable
                            key={post.id}
                            draggableId={post.id}
                            index={index}
                          >
                            {(providedDrag, snapshotDrag) => (
                              <div
                                ref={providedDrag.innerRef}
                                {...providedDrag.draggableProps}
                                {...providedDrag.dragHandleProps}
                                className={cn(
                                  "rounded-lg border border-[#303030] bg-[#181818] p-3 text-xs shadow-sm transition-all hover:border-[#3C3C3C] cursor-pointer space-y-2",
                                  snapshotDrag.isDragging ? "shadow-2xl border-[#8B5CF6] rotate-1 bg-[#202020]" : "",
                                  isUpdating ? "opacity-50 pointer-events-none" : ""
                                )}
                                onClick={() => onPreview(post)}
                              >
                                {/* Platform Badges & Priority */}
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {post.platforms?.slice(0, 3).map((p) => (
                                      <PlatformBadge key={p.platform} platform={p.platform} />
                                    ))}
                                    {post.platforms && post.platforms.length > 3 && (
                                      <span className="text-[9px] text-[#737373]">
                                        +{post.platforms.length - 3}
                                      </span>
                                    )}
                                  </div>
                                  <PriorityBadge priority={post.priority} />
                                </div>

                                {/* Media Thumbnail if present */}
                                {primaryMedia && (
                                  <div className="h-20 w-full rounded-md bg-[#262626] border border-[#303030] overflow-hidden flex items-center justify-center relative">
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3]">
                                      <ImageIcon className="h-4 w-4 text-[#8B5CF6]" />
                                      <span className="truncate max-w-[120px]">{primaryMedia.file?.originalName || "Media Attached"}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Post Title */}
                                <h4 className="font-semibold text-xs text-[#F5F5F5] hover:text-[#8B5CF6] transition-colors leading-snug line-clamp-2">
                                  {post.title}
                                </h4>

                                {/* Caption Preview */}
                                <p className="text-[11px] text-[#A3A3A3] line-clamp-2">
                                  {post.content || post.description || "No caption added."}
                                </p>

                                {/* Footer: Campaign & Planned Date */}
                                <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#303030] text-[10px] text-[#737373]">
                                  {post.campaign ? (
                                    <span className="truncate max-w-[90px] text-[#A3A3A3] flex items-center gap-1">
                                      <Megaphone className="h-2.5 w-2.5 text-[#F59E0B]" />
                                      {post.campaign.name}
                                    </span>
                                  ) : (
                                    <span />
                                  )}

                                  {post.plannedAt && (
                                    <span className="text-[#A3A3A3] font-mono shrink-0 flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5 text-[#EC4899]" />
                                      {new Date(post.plannedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        timeZone: "Asia/Kolkata",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Manual Publish Confirmation Modal */}
      <DarkConfirmationDialog
        open={publishConfirmOpen}
        onClose={() => {
          setPublishConfirmOpen(false);
          setPendingPublishPost(null);
        }}
        onConfirm={handleConfirmPublish}
        title="Confirm Manual Publishing"
        description={`Are you sure you want to mark "${pendingPublishPost?.title}" as PUBLISHED? In accordance with the system policy, posts can only transition to Published after manual verification.`}
        confirmLabel="Confirm Publish"
        variant="primary"
      />
    </>
  );
}
