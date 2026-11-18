"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Loader2,
  FileText,
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
import { PostComposerModal } from "./post-composer-modal";
import { PostPreviewModal } from "./post-preview-modal";
import { StatusTransitionDialog } from "./status-transition-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import { ALL_PLATFORMS, getPlatformMeta } from "./social-badges";
import { cn } from "@/lib/utils";

interface PostsManagerProps {
  initialCampaignId?: string;
  initialStatus?: SocialPostStatus;
}

export function PostsManager({ initialCampaignId, initialStatus }: PostsManagerProps) {
  const [posts, setPosts] = useState<SocialPostDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<string>(initialStatus || "all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>(initialCampaignId || "all");
  const [pillarFilter, setPillarFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"plannedAt" | "createdAt" | "priority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  useEffect(() => {
    fetchPosts();
  }, [statusTab, platformFilter, campaignFilter, pillarFilter, priorityFilter, sortBy, sortOrder]);

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
      if (statusTab !== "all") params.set("status", statusTab);
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
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
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

      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border/60">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusTab(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              statusTab === tab.id
                ? "bg-white/[0.1] text-foreground font-semibold"
                : "text-secondary-text hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c1320]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
          <input
            placeholder="Search by title, description, or platform caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[125px]"
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
              className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[125px]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Content Pillar Filter */}
          {pillars.length > 0 && (
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[125px]"
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
            className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[110px]"
          >
            <option value="all">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "plannedAt" | "createdAt" | "priority")}
            className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[125px]"
          >
            <option value="createdAt">Date Created</option>
            <option value="plannedAt">Planned Date</option>
            <option value="priority">Priority</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-8 px-2 text-xs"
            title={`Sort Order: ${sortOrder.toUpperCase()}`}
          >
            {sortOrder === "asc" ? "Asc" : "Desc"}
          </Button>
        </div>
      </div>

      {/* Posts List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Loading social content...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-xs border border-dashed border-white/[0.08] rounded-xl p-8 space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-foreground">No social posts found</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create drafts, plan platform variants, attach media, and schedule publishing dates.
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Plan Content Post
          </Button>
        </div>
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
