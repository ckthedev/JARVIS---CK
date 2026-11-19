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
  FileText,
  CheckCircle2,
  FileEdit,
  ArrowRight,
  Activity,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { MetricCard } from "@/components/dark-workspace/metric-card";
import { DarkCard } from "@/components/dark-workspace/dark-card";

export function SocialDashboard() {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [upcomingPosts, setUpcomingPosts] = useState<SocialPostDto[]>([]);
  const [recentActivity, setRecentActivity] = useState<SocialPostDto[]>([]);
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
      const [statsRes, postsRes, recentRes, campRes, pilRes] = await Promise.all([
        fetch("/api/social/stats"),
        fetch("/api/social/posts?limit=5&sortBy=plannedAt&sortOrder=asc&status=SCHEDULED"),
        fetch("/api/social/posts?limit=5&sortBy=updatedAt&sortOrder=desc"),
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
      if (recentRes.ok) {
        const d = await recentRes.json();
        setRecentActivity(d.posts || []);
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

  const total = stats?.total || 0;
  const drafts = stats?.drafts || 0;
  const inReview = stats?.inReview || 0;
  const approved = stats?.approved || 0;
  const scheduled = stats?.scheduled || 0;
  const published = stats?.published || 0;

  return (
    <div className="space-y-6">
      <SocialNav onOpenCreate={() => setComposerOpen(true)} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#A3A3A3] gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
          <span className="text-xs">Loading social media workspace...</span>
        </div>
      ) : (
        <>
          {/* Top 6 Metric Cards: Total, Drafts, Awaiting Review, Approved, Scheduled, Published */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              title="Total Posts"
              value={total}
              subtext="All content assets"
              icon={Layers}
              iconColor="#8B5CF6"
              accentColor="#8B5CF6"
              href="/social/posts"
            />
            <MetricCard
              title="Drafts"
              value={drafts}
              subtext="In progress ideas"
              icon={FileEdit}
              iconColor="#A3A3A3"
              accentColor="#737373"
              href="/social/posts?status=DRAFT"
            />
            <MetricCard
              title="Awaiting Review"
              value={inReview}
              subtext="Needs approval"
              icon={Clock}
              iconColor="#F59E0B"
              accentColor="#F59E0B"
              href="/social/posts?status=IN_REVIEW"
            />
            <MetricCard
              title="Approved"
              value={approved}
              subtext="Ready to queue"
              icon={CheckCircle2}
              iconColor="#3B82F6"
              accentColor="#3B82F6"
              href="/social/posts?status=APPROVED"
            />
            <MetricCard
              title="Scheduled"
              value={scheduled}
              subtext="Queued for release"
              icon={Calendar}
              iconColor="#EC4899"
              accentColor="#EC4899"
              href="/social/calendar"
            />
            <MetricCard
              title="Published"
              value={published}
              subtext="Live confirmations"
              icon={Send}
              iconColor="#22C55E"
              accentColor="#22C55E"
              href="/social/posts?status=PUBLISHED"
            />
          </div>

          {/* Content Status Distribution Meter */}
          <DarkCard noPadding className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#8B5CF6]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
                  Content Pipeline Distribution
                </h3>
              </div>
              <span className="text-xs text-[#A3A3A3] font-mono">
                {total} total items in workflow
              </span>
            </div>

            {total === 0 ? (
              <p className="text-xs text-[#737373] py-4 text-center">
                No content items currently in pipeline.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Horizontal Segmented Bar */}
                <div className="h-2.5 w-full rounded-full bg-[#181818] overflow-hidden flex border border-[#303030]">
                  <div
                    className="h-full bg-[#737373]"
                    style={{ width: `${(drafts / total) * 100}%` }}
                    title={`Drafts: ${drafts}`}
                  />
                  <div
                    className="h-full bg-[#F59E0B]"
                    style={{ width: `${(inReview / total) * 100}%` }}
                    title={`In Review: ${inReview}`}
                  />
                  <div
                    className="h-full bg-[#3B82F6]"
                    style={{ width: `${(approved / total) * 100}%` }}
                    title={`Approved: ${approved}`}
                  />
                  <div
                    className="h-full bg-[#EC4899]"
                    style={{ width: `${(scheduled / total) * 100}%` }}
                    title={`Scheduled: ${scheduled}`}
                  />
                  <div
                    className="h-full bg-[#22C55E]"
                    style={{ width: `${(published / total) * 100}%` }}
                    title={`Published: ${published}`}
                  />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                    <span className="h-2 w-2 rounded-full bg-[#737373]" />
                    Drafts: <strong className="text-[#F5F5F5]">{drafts}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                    Review: <strong className="text-[#F5F5F5]">{inReview}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                    <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                    Approved: <strong className="text-[#F5F5F5]">{approved}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                    <span className="h-2 w-2 rounded-full bg-[#EC4899]" />
                    Scheduled: <strong className="text-[#F5F5F5]">{scheduled}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                    Published: <strong className="text-[#F5F5F5]">{published}</strong>
                  </span>
                </div>
              </div>
            )}
          </DarkCard>

          {/* Main Workspace Layout (2 columns: 8 cols left, 4 cols right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 8 Cols: Upcoming Content & Platform Distribution */}
            <div className="lg:col-span-8 space-y-5">
              {/* Upcoming Scheduled Content Card */}
              <DarkCard noPadding className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#EC4899]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
                      Upcoming Scheduled Content
                    </h3>
                  </div>
                  <Link
                    href="/social/calendar"
                    className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1"
                  >
                    Open Calendar <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {upcomingPosts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#737373]">
                    No posts currently scheduled. Plan a post and assign a release date.
                  </div>
                ) : (
                  <div className="space-y-2 mt-3.5">
                    {upcomingPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setPreviewPost(post);
                          setPreviewOpen(true);
                        }}
                        className="p-3 rounded-lg border border-[#303030] bg-[#181818] hover:bg-[#262626] transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1 shrink-0">
                            {post.platforms?.map((p) => (
                              <PlatformIcon key={p.platform} platform={p.platform} className="h-3.5 w-3.5" />
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#F5F5F5] truncate">
                              {post.title}
                            </p>
                            <p className="text-[11px] text-[#A3A3A3] truncate">
                              {post.content || post.description || "No caption"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <PostStatusBadge status={post.status} />
                          {post.plannedAt && (
                            <span className="text-[11px] font-mono text-[#A3A3A3] bg-[#262626] px-2 py-0.5 rounded border border-[#303030]">
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
              </DarkCard>

              {/* Platform Distribution Card */}
              <DarkCard noPadding className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#8B5CF6]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
                      Platform Distribution
                    </h3>
                  </div>
                  <span className="text-xs text-[#A3A3A3] font-mono">
                    {total} posts across channels
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3.5">
                  {ALL_PLATFORMS.map((platform) => {
                    const count = stats?.byPlatform?.[platform] || 0;
                    const meta = getPlatformMeta(platform);
                    return (
                      <div
                        key={platform}
                        className="p-3 rounded-lg border border-[#303030] bg-[#181818] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={platform} className="h-4 w-4" />
                          <span className="text-xs font-medium text-[#F5F5F5]">{meta.label}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-[#F5F5F5]">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </DarkCard>

              {/* Recent Content Activity */}
              <DarkCard noPadding className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#22C55E]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
                      Recent Content Activity
                    </h3>
                  </div>
                  <Link
                    href="/social/posts"
                    className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1"
                  >
                    View All Posts <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#737373]">
                    No recent activity recorded.
                  </div>
                ) : (
                  <div className="space-y-2 mt-3.5">
                    {recentActivity.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setPreviewPost(post);
                          setPreviewOpen(true);
                        }}
                        className="p-2.5 rounded-lg border border-[#303030] bg-[#181818] hover:bg-[#262626] transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-[#737373] shrink-0" />
                          <span className="font-medium text-[#F5F5F5] truncate">
                            {post.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PostStatusBadge status={post.status} />
                          <span className="text-[10px] text-[#737373] font-mono">
                            {new Date(post.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DarkCard>
            </div>

            {/* Right 4 Cols: Quick Actions & Campaign Overview */}
            <div className="lg:col-span-4 space-y-5">
              {/* Quick Actions Panel */}
              <DarkCard noPadding className="p-4 sm:p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] mb-3 pb-2 border-b border-[#303030]">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => setComposerOpen(true)}
                    className="w-full justify-start text-xs h-9 gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Plan New Content Post
                  </Button>
                  <Link
                    href="/social/calendar"
                    className="w-full flex items-center justify-start text-xs h-9 px-3 rounded-lg border border-[#303030] bg-[#181818] hover:bg-[#262626] text-[#F5F5F5] gap-2 transition-colors font-medium"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#3B82F6]" /> Content Calendar
                  </Link>
                  <Link
                    href="/social/campaigns"
                    className="w-full flex items-center justify-start text-xs h-9 px-3 rounded-lg border border-[#303030] bg-[#181818] hover:bg-[#262626] text-[#F5F5F5] gap-2 transition-colors font-medium"
                  >
                    <Megaphone className="h-3.5 w-3.5 text-[#F59E0B]" /> Campaigns Overview
                  </Link>
                  <Link
                    href="/social/hashtags"
                    className="w-full flex items-center justify-start text-xs h-9 px-3 rounded-lg border border-[#303030] bg-[#181818] hover:bg-[#262626] text-[#F5F5F5] gap-2 transition-colors font-medium"
                  >
                    <Hash className="h-3.5 w-3.5 text-[#22C55E]" /> Hashtag Library
                  </Link>
                </div>
              </DarkCard>

              {/* Campaign Overview Widget */}
              <DarkCard noPadding className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-[#F59E0B]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
                      Campaign Overview
                    </h3>
                  </div>
                  <Link
                    href="/social/campaigns"
                    className="text-[11px] text-[#8B5CF6] hover:underline"
                  >
                    All ({campaigns.length}) &rarr;
                  </Link>
                </div>

                {campaigns.length === 0 ? (
                  <p className="text-xs text-[#737373] py-6 text-center">
                    No active campaigns. Create one to organize content themes.
                  </p>
                ) : (
                  <div className="space-y-2.5 mt-3.5">
                    {campaigns.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-[#303030] bg-[#181818] flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-[#F5F5F5] truncate">{c.name}</p>
                          <p className="text-[10px] text-[#737373] truncate mt-0.5">
                            {c.postCount || 0} posts &bull; {c.platforms?.length || 0} channels
                          </p>
                        </div>
                        <span className="rounded-full bg-[#262626] border border-[#303030] px-2 py-0.5 text-[9px] font-bold text-[#A3A3A3] shrink-0">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </DarkCard>

              {/* Content Pillars Widget */}
              <DarkCard noPadding className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#8B5CF6]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
                      Content Pillars
                    </h3>
                  </div>
                  <span className="text-xs text-[#737373] font-mono">
                    {pillars.length} pillars
                  </span>
                </div>

                {pillars.length === 0 ? (
                  <p className="text-xs text-[#737373] py-6 text-center">
                    No content pillars configured.
                  </p>
                ) : (
                  <div className="space-y-2 mt-3.5">
                    {pillars.map((p) => {
                      const col = p.color || "#8B5CF6";
                      return (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-lg border border-[#303030] bg-[#181818] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: col }}
                            />
                            <span className="font-medium text-[#F5F5F5]">{p.name}</span>
                          </div>
                          <span className="text-[11px] text-[#A3A3A3] font-mono">
                            {p.postCount || 0} posts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DarkCard>
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
