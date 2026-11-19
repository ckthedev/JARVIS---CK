"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Loader2,
  FileText,
  Kanban,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SocialPostDto,
  SocialPostStatus,
  SocialCampaignDto,
  ContentPillarDto,
} from "../types";
import { SocialNav } from "./social-nav";
import { PostCard } from "./post-card";
import { SocialKanbanBoard } from "./social-kanban-board";
import { PostComposerModal } from "./post-composer-modal";
import { PostPreviewModal } from "./post-preview-modal";
import { StatusTransitionDialog } from "./status-transition-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import { ALL_PLATFORMS, getPlatformMeta } from "./social-badges";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PostsManagerProps {
  initialCampaignId?: string;
  initialStatus?: SocialPostStatus;
}

export function PostsManager({ initialCampaignId, initialStatus }: PostsManagerProps) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<SocialPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Filters
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<string>(initialStatus || "all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>(initialCampaignId || "all");
  const [pillarFilter, setPillarFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy] = useState<"plannedAt" | "createdAt" | "priority">("createdAt");
  const [sortOrder] = useState<"asc" | "desc">("desc");

  // Reference Data
  const [campaigns, setCampaigns] = useState<SocialCampaignDto[]>([]);
  const [pillars, setPillars] = useState<ContentPillarDto[]>([]);

  // Modals
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPostDto | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<SocialPostDto | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusPost, setStatusPost] = useState<SocialPostDto | null>(null);

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [reschedulePost, setReschedulePost] = useState<SocialPostDto | null>(null);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [campRes, pilRes] = await Promise.all([
        fetch("/api/social/campaigns"),
        fetch("/api/social/pillars"),
      ]);
      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(d.campaigns || []);
      }
      if (pilRes.ok) {
        const d = await pilRes.json();
        setPillars(d.pillars || []);
      }
    } catch (err) {
      console.error("Failed to load reference data:", err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (viewMode === "list" && statusTab !== "all") {
        params.set("status", statusTab);
      }
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (campaignFilter !== "all") params.set("campaignId", campaignFilter);
      if (pillarFilter !== "all") params.set("contentPillarId", pillarFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/social/posts?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setPosts(d.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, statusTab, platformFilter, campaignFilter, pillarFilter, priorityFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setComposerOpen(true);
  };

  const handleEdit = (p: SocialPostDto) => {
    setEditingPost(p);
    setComposerOpen(true);
  };

  const handlePreview = (p: SocialPostDto) => {
    setPreviewPost(p);
    setPreviewOpen(true);
  };

  const handleStatusChange = (p: SocialPostDto) => {
    setStatusPost(p);
    setStatusDialogOpen(true);
  };

  const handleReschedule = (p: SocialPostDto) => {
    setReschedulePost(p);
    setRescheduleDialogOpen(true);
  };

  const handleDuplicate = async (p: SocialPostDto) => {
    try {
      const res = await fetch(`/api/social/posts/${p.id}/duplicate`, { method: "POST" });
      if (res.ok) {
        toast({ title: "Post Duplicated", description: "Created duplicate draft successfully." });
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to duplicate post:", err);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Post Deleted", description: "Post deleted and reminders cleaned up." });
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleKanbanStatusMoved = async (post: SocialPostDto, newStatus: SocialPostStatus): Promise<boolean> => {
    // Optimistic state update
    const previousPosts = [...posts];
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch(`/api/social/posts/${post.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: `Moved to ${newStatus} via Kanban board`,
        }),
      });

      if (!res.ok) {
        setPosts(previousPosts);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Failed to persist status change:", err);
      setPosts(previousPosts);
      return false;
    }
  };

  const statusTabs = [
    { id: "all", label: "All Posts" },
    { id: "IDEA", label: "Ideas" },
    { id: "DRAFT", label: "Drafts" },
    { id: "IN_REVIEW", label: "In Review" },
    { id: "APPROVED", label: "Approved" },
    { id: "SCHEDULED", label: "Scheduled" },
    { id: "PUBLISHED", label: "Published" },
  ];

  return (
    <div className="space-y-6">
      <SocialNav onOpenCreate={handleOpenCreate} />

      {/* View Switcher & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl border border-[#303030] bg-[#202020]">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#737373]" />
          <input
            placeholder="Search by title, description, or platform caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:border-[#8B5CF6] focus:outline-none"
          />
        </form>

        {/* View Switcher (Kanban vs List) & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kanban / List Toggle */}
          <div className="flex items-center rounded-lg border border-[#303030] bg-[#181818] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-[#262626] text-[#F5F5F5] font-semibold border border-[#383838]"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-[#262626] text-[#F5F5F5] font-semibold border border-[#383838]"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-lg bg-[#181818] border border-[#303030] text-[#F5F5F5] focus:border-[#8B5CF6] focus:outline-none min-w-[120px]"
          >
            <option value="all">All Platforms</option>
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {getPlatformMeta(p).label}
              </option>
            ))}
          </select>

          {/* Campaign Filter */}
          {campaigns.length > 0 && (
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-lg bg-[#181818] border border-[#303030] text-[#F5F5F5] focus:border-[#8B5CF6] focus:outline-none min-w-[120px]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Pillar Filter */}
          {pillars.length > 0 && (
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-lg bg-[#181818] border border-[#303030] text-[#F5F5F5] focus:border-[#8B5CF6] focus:outline-none min-w-[110px]"
            >
              <option value="all">All Pillars</option>
              {pillars.map((pil) => (
                <option key={pil.id} value={pil.id}>
                  {pil.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-lg bg-[#181818] border border-[#303030] text-[#F5F5F5] focus:border-[#8B5CF6] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Status Filter Tabs (only in List view) */}
      {viewMode === "list" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#303030]">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border",
                statusTab === tab.id
                  ? "bg-[#262626] text-[#F5F5F5] border-[#8B5CF6]/50 font-semibold"
                  : "bg-[#202020] text-[#A3A3A3] border-[#303030] hover:text-[#F5F5F5]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content: Kanban Board or List View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#A3A3A3] gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#A3A3A3]" />
          <span className="text-xs">Loading social content...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-[#737373] text-xs border border-[#292929] bg-[#181818]/60 rounded-xl p-8 space-y-3">
          <FileText className="h-10 w-10 text-[#555555] mx-auto" />
          <p className="text-sm font-semibold text-[#F5F5F5]">No social posts found</p>
          <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
            Create drafts, plan platform variants, attach media, and schedule publishing dates.
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs gap-1.5 bg-[#383838] hover:bg-[#454545] text-[#F5F5F5]"
          >
            <Plus className="h-3.5 w-3.5" /> Plan Content Post
          </Button>
        </div>
      ) : viewMode === "kanban" ? (
        <SocialKanbanBoard
          posts={posts}
          onStatusChange={handleKanbanStatusMoved}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onReschedule={handleReschedule}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onCreateInColumn={() => {
            setEditingPost(null);
            setComposerOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPreview={handlePreview}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onReschedule={handleReschedule}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PostComposerModal
        post={editingPost}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSuccess={() => fetchPosts()}
      />

      <PostPreviewModal
        post={previewPost}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onEdit={(p) => {
          setEditingPost(p);
          setComposerOpen(true);
        }}
      />

      <StatusTransitionDialog
        post={statusPost}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onSuccess={() => fetchPosts()}
      />

      <RescheduleDialog
        post={reschedulePost}
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        onSuccess={() => fetchPosts()}
      />
    </div>
  );
}
