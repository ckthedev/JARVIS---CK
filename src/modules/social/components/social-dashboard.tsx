"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Megaphone,
  Hash,
  Clock,
  TrendingUp,
  Plus,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SocialStats,
  SocialPostDto,
  SocialCampaignDto,
  ContentPillarDto,
} from "../types";
import { SocialNav } from "./social-nav";
import { ALL_PLATFORMS, PlatformIcon, getPlatformMeta, PostStatusBadge } from "./social-badges";
import { PostComposerModal } from "./post-composer-modal";
import { PostPreviewModal } from "./post-preview-modal";
import { cn } from "@/lib/utils";

export function SocialDashboard() {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [upcomingPosts, setUpcomingPosts] = useState<SocialPostDto[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCampaignDto[]>([]);
  const [pillars, setPillars] = useState<ContentPillarDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<SocialPostDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, postsRes, campRes, pilRes] = await Promise.all([
        fetch("/api/social/stats"),
        fetch("/api/social/posts?limit=5&sortBy=plannedAt&sortOrder=asc&status=SCHEDULED"),
        fetch("/api/social/campaigns"),
        fetch("/api/social/pillars"),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }
      if (postsRes.ok) {
        const d = await postsRes.json();
        setUpcomingPosts(d.posts || []);
      }
      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(d.campaigns || []);
      }
      if (pilRes.ok) {
        const d = await pilRes.json();
        setPillars(d.pillars || []);
      }
    } catch (err) {
      console.error("Failed to load social dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SocialNav onOpenCreate={() => setComposerOpen(true)} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-xs">Loading social media overview...</span>
        </div>
      ) : (
        <>
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Scheduled */}
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] space-y-1">
              <span className="text-[11px] uppercase font-semibold text-cyan-400">Scheduled</span>
              <div className="text-2xl font-bold text-foreground font-mono">
                {stats?.scheduled || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">Ready to publish</p>
            </div>

            {/* In Review & Approved */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] space-y-1">
              <span className="text-[11px] uppercase font-semibold text-amber-400">In Review</span>
              <div className="text-2xl font-bold text-foreground font-mono">
                {stats?.inReview || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">{stats?.approved || 0} approved</p>
            </div>

            {/* Drafts & Ideas */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] space-y-1">
              <span className="text-[11px] uppercase font-semibold text-blue-400">Drafts</span>
              <div className="text-2xl font-bold text-foreground font-mono">
                {stats?.drafts || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">{stats?.ideas || 0} ideas</p>
            </div>

            {/* Published */}
            <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/[0.04] space-y-1">
              <span className="text-[11px] uppercase font-semibold text-green-400">Published</span>
              <div className="text-2xl font-bold text-foreground font-mono">
                {stats?.published || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">Historical live posts</p>
            </div>

            {/* Overdue Alert */}
            <div
              className={cn(
                "p-4 rounded-xl border space-y-1",
                stats?.overdue && stats.overdue > 0
                  ? "border-red-500/30 bg-red-500/[0.05]"
                  : "border-white/[0.08] bg-[#0c1320]"
              )}
            >
              <span
                className={cn(
                  "text-[11px] uppercase font-semibold",
                  stats?.overdue && stats.overdue > 0 ? "text-red-400" : "text-muted-foreground"
                )}
              >
                Past Due
              </span>
              <div className="text-2xl font-bold text-foreground font-mono">
                {stats?.overdue || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">Requires manual update</p>
            </div>

            {/* Active Campaigns */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.04] space-y-1">
              <span className="text-[11px] uppercase font-semibold text-purple-400">Campaigns</span>
              <div className="text-2xl font-bold text-foreground font-mono">
                {stats?.activeCampaignsCount || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">{stats?.totalPillarsCount || 0} content pillars</p>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Upcoming Content & Platform Distribution */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Scheduled Posts Card */}
              <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c1320] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <h3 className="font-semibold text-sm text-foreground">Upcoming Scheduled Content</h3>
                  </div>
                  <Link
                    href="/social/calendar"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View Calendar &rarr;
                  </Link>
                </div>

                {upcomingPosts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    No posts currently scheduled. Plan a post and assign a publishing date.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setPreviewPost(post);
                          setPreviewOpen(true);
                        }}
                        className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1 shrink-0">
                            {post.platforms?.map((p) => (
                              <PlatformIcon key={p.platform} platform={p.platform} className="h-3.5 w-3.5" />
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {post.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {post.content || post.description || "No caption"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <PostStatusBadge status={post.status} />
                          {post.plannedAt && (
                            <span className="text-[11px] font-mono text-cyan-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
                              {new Date(post.plannedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                timeZone: "Asia/Kolkata",
                              })}{" "}
                              IST
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Platform Distribution Bar */}
              <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c1320] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">Content by Platform</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Total Variants: {stats?.total || 0} posts
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ALL_PLATFORMS.map((platform) => {
                    const count = stats?.byPlatform?.[platform] || 0;
                    const meta = getPlatformMeta(platform);
                    return (
                      <div
                        key={platform}
                        className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={platform} className="h-4 w-4" />
                          <span className="text-xs font-medium text-foreground">{meta.label}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-foreground/90">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Campaigns, Pillars & Quick Shortcuts */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c1320] space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => setComposerOpen(true)}
                    className="w-full justify-start text-xs h-9 gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" /> Plan New Content Post
                  </Button>
                  <Link
                    href="/social/calendar"
                    className="w-full flex items-center justify-start text-xs h-9 px-3 rounded-lg border border-border/80 bg-card/60 hover:bg-card text-foreground gap-2 transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Open Social Calendar
                  </Link>
                  <Link
                    href="/social/campaigns"
                    className="w-full flex items-center justify-start text-xs h-9 px-3 rounded-lg border border-border/80 bg-card/60 hover:bg-card text-foreground gap-2 transition-colors"
                  >
                    <Megaphone className="h-3.5 w-3.5 text-purple-400" /> Manage Campaigns
                  </Link>
                  <Link
                    href="/social/hashtags"
                    className="w-full flex items-center justify-start text-xs h-9 px-3 rounded-lg border border-border/80 bg-card/60 hover:bg-card text-foreground gap-2 transition-colors"
                  >
                    <Hash className="h-3.5 w-3.5 text-primary" /> Hashtag Library & Collections
                  </Link>
                </div>
              </div>

              {/* Active Campaigns List */}
              <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c1320] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-foreground">Active Campaigns</h3>
                  </div>
                  <Link
                    href="/social/campaigns"
                    className="text-[11px] text-primary hover:underline"
                  >
                    All &rarr;
                  </Link>
                </div>

                {campaigns.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No active campaigns. Create one to organize content themes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {campaigns.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.postCount || 0} posts &bull; {c.status}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Pillars */}
              <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c1320] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">Content Pillars</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {pillars.length} pillars
                  </span>
                </div>

                {pillars.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No content pillars configured.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {pillars.map((p) => {
                      const col = p.color || "#00D4FF";
                      return (
                        <div
                          key={p.id}
                          className="p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: col }}
                            />
                            <span className="font-medium text-foreground">{p.name}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {p.postCount || 0} posts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <PostComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSuccess={() => loadDashboardData()}
      />

      <PostPreviewModal
        post={previewPost}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
