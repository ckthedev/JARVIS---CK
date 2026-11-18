"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SocialPostDto, SocialCampaignDto } from "../types";
import { SocialNav } from "./social-nav";
import { SocialCalendarView } from "./calendar-view";
import { PostComposerModal } from "./post-composer-modal";
import { PostPreviewModal } from "./post-preview-modal";

export function SocialCalendarPage() {
  const [posts, setPosts] = useState<SocialPostDto[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCampaignDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPostDto | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const [calRes, campRes] = await Promise.all([
        fetch("/api/social/calendar"),
        fetch("/api/social/campaigns"),
      ]);

      if (calRes.ok) {
        const d = await calRes.json();
        setPosts(d.posts || []);
      }
      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(d.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPost = (p: SocialPostDto) => {
    setSelectedPost(p);
    setPreviewOpen(true);
  };

  const handleOpenCreateWithDate = () => {
    setComposerOpen(true);
  };

  return (
    <div className="space-y-6">
      <SocialNav onOpenCreate={() => setComposerOpen(true)} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-xs">Loading social calendar...</span>
        </div>
      ) : (
        <SocialCalendarView
          posts={posts}
          campaigns={campaigns}
          onSelectPost={handleSelectPost}
          onOpenCreateWithDate={handleOpenCreateWithDate}
        />
      )}

      {/* Modals */}
      <PostComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSuccess={() => fetchCalendarData()}
      />

      <PostPreviewModal
        post={selectedPost}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
