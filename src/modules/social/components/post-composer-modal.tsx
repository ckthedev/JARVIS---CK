"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Hash,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Bell,
} from "lucide-react";
import {
  SocialPostDto,
  SocialPlatform,
  SocialPostStatus,
  SocialPostPriority,
  ContentPillarDto,
  SocialCampaignDto,
  HashtagDto,
  HashtagCollectionDto,
} from "../types";
import { FileDto } from "@/modules/files/types";
import { ALL_PLATFORMS, PlatformIcon, getPlatformMeta } from "./social-badges";
import { MediaPickerModal } from "./media-picker-modal";
import { cn } from "@/lib/utils";

interface PostComposerModalProps {
  post?: SocialPostDto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (saved: SocialPostDto) => void;
}

export function PostComposerModal({
  post,
  open,
  onClose,
  onSuccess,
}: PostComposerModalProps) {
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [status, setStatus] = useState<SocialPostStatus>("DRAFT");
  const [priority, setPriority] = useState<SocialPostPriority>("NORMAL");
  const [campaignId, setCampaignId] = useState<string | "none">("none");
  const [contentPillarId, setContentPillarId] = useState<string | "none">("none");

  // Scheduling State
  const [hasSchedule, setHasSchedule] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("10:00");
  const [reminderOffsets, setReminderOffsets] = useState<number[]>([15]);

  // Platform Variants State
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(["INSTAGRAM"]);
  const [activeTabPlatform, setActiveTabPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [platformData, setPlatformData] = useState<
    Record<SocialPlatform, { caption: string; title: string; description: string }>
  >({
    INSTAGRAM: { caption: "", title: "", description: "" },
    FACEBOOK: { caption: "", title: "", description: "" },
    LINKEDIN: { caption: "", title: "", description: "" },
    PINTEREST: { caption: "", title: "", description: "" },
    THREADS: { caption: "", title: "", description: "" },
    YOUTUBE: { caption: "", title: "", description: "" },
  });

  // Media State
  const [selectedMedia, setSelectedMedia] = useState<
    Array<{ fileId: string; displayOrder: number; caption?: string | null; file?: FileDto | null }>
  >([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Hashtag State
  const [selectedHashtagIds, setSelectedHashtagIds] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<HashtagDto[]>([]);
  const [collections, setCollections] = useState<HashtagCollectionDto[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCampaignDto[]>([]);
  const [pillars, setPillars] = useState<ContentPillarDto[]>([]);

  // Metadata & Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadReferenceData();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setError(null);
      if (post) {
        setTitle(post.title);
        setDescription(post.description || "");
        setInternalNotes(post.internalNotes || "");
        setStatus(post.status);
        setPriority(post.priority);
        setCampaignId(post.campaignId || "none");
        setContentPillarId(post.contentPillarId || "none");

        if (post.plannedAt) {
          setHasSchedule(true);
          const d = new Date(post.plannedAt);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          setDateStr(`${yyyy}-${mm}-${dd}`);
          setTimeStr(`${hh}:${min}`);
        } else {
          setHasSchedule(false);
          const tomorrow = new Date(Date.now() + 86400000);
          setDateStr(tomorrow.toISOString().split("T")[0]);
          setTimeStr("10:00");
        }

        const nextPlatforms: SocialPlatform[] = [];
        const nextData = {
          INSTAGRAM: { caption: "", title: "", description: "" },
          FACEBOOK: { caption: "", title: "", description: "" },
          LINKEDIN: { caption: "", title: "", description: "" },
          PINTEREST: { caption: "", title: "", description: "" },
          THREADS: { caption: "", title: "", description: "" },
          YOUTUBE: { caption: "", title: "", description: "" },
        };

        if (post.platforms && post.platforms.length > 0) {
          post.platforms.forEach((p) => {
            nextPlatforms.push(p.platform);
            nextData[p.platform] = {
              caption: p.caption || post.content || "",
              title: p.title || "",
              description: p.description || "",
            };
          });
        } else {
          nextPlatforms.push("INSTAGRAM");
          nextData["INSTAGRAM"].caption = post.content || "";
        }

        setSelectedPlatforms(nextPlatforms);
        setActiveTabPlatform(nextPlatforms[0] || "INSTAGRAM");
        setPlatformData(nextData);

        if (post.media) {
          setSelectedMedia(
            post.media.map((m) => ({
              fileId: m.fileId,
              displayOrder: m.displayOrder,
              caption: m.caption,
              file: m.file,
            }))
          );
        } else {
          setSelectedMedia([]);
        }

        if (post.hashtags) {
          setSelectedHashtagIds(post.hashtags.map((h) => h.hashtagId));
        } else {
          setSelectedHashtagIds([]);
        }
      } else {
        setTitle("");
        setDescription("");
        setInternalNotes("");
        setStatus("DRAFT");
        setPriority("NORMAL");
        setCampaignId("none");
        setContentPillarId("none");
        setHasSchedule(false);

        const tomorrow = new Date(Date.now() + 86400000);
        setDateStr(tomorrow.toISOString().split("T")[0]);
        setTimeStr("10:00");
        setReminderOffsets([15]);

        setSelectedPlatforms(["INSTAGRAM"]);
        setActiveTabPlatform("INSTAGRAM");
        setPlatformData({
          INSTAGRAM: { caption: "", title: "", description: "" },
          FACEBOOK: { caption: "", title: "", description: "" },
          LINKEDIN: { caption: "", title: "", description: "" },
          PINTEREST: { caption: "", title: "", description: "" },
          THREADS: { caption: "", title: "", description: "" },
          YOUTUBE: { caption: "", title: "", description: "" },
        });
        setSelectedMedia([]);
        setSelectedHashtagIds([]);
      }
    }
  }, [open, post]);

  const loadReferenceData = async () => {
    try {
      const [campRes, pilRes, htRes, collRes] = await Promise.all([
        fetch("/api/social/campaigns"),
        fetch("/api/social/pillars"),
        fetch("/api/social/hashtags"),
        fetch("/api/social/hashtags/collections"),
      ]);

      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(d.campaigns || []);
      }
      if (pilRes.ok) {
        const d = await pilRes.json();
        setPillars(d.pillars || []);
      }
      if (htRes.ok) {
        const d = await htRes.json();
        setHashtags(d.hashtags || []);
      }
      if (collRes.ok) {
        const d = await collRes.json();
        setCollections(d.collections || []);
      }
    } catch (err) {
      console.error("Failed to load reference data for composer:", err);
    }
  };

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) return;
      const updated = selectedPlatforms.filter((item) => item !== p);
      setSelectedPlatforms(updated);
      if (activeTabPlatform === p) {
        setActiveTabPlatform(updated[0]);
      }
    } else {
      const updated = [...selectedPlatforms, p];
      setSelectedPlatforms(updated);
      setActiveTabPlatform(p);
    }
  };

  const updateCaption = (text: string) => {
    setPlatformData((prev) => ({
      ...prev,
      [activeTabPlatform]: {
        ...prev[activeTabPlatform],
        caption: text,
      },
    }));
  };

  const insertHashtags = (tags: string[]) => {
    const current = platformData[activeTabPlatform].caption;
    const tagString = tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    const updated = current ? `${current}\n\n${tagString}` : tagString;
    updateCaption(updated);
  };

  const copyFromPlatform = (sourcePlatform: SocialPlatform) => {
    const sourceData = platformData[sourcePlatform];
    setPlatformData((prev) => ({
      ...prev,
      [activeTabPlatform]: {
        caption: sourceData.caption,
        title: sourceData.title,
        description: sourceData.description,
      },
    }));
  };

  const toggleReminderOffset = (offset: number) => {
    if (reminderOffsets.includes(offset)) {
      setReminderOffsets(reminderOffsets.filter((o) => o !== offset));
    } else {
      setReminderOffsets([...reminderOffsets, offset].sort((a, b) => b - a));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for this post.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let plannedAtIso: string | null = null;
      if (hasSchedule && dateStr && timeStr) {
        const combined = new Date(`${dateStr}T${timeStr}:00`);
        if (isNaN(combined.getTime())) {
          throw new Error("Invalid date or time selected.");
        }
        plannedAtIso = combined.toISOString();
      }

      const platformsPayload = selectedPlatforms.map((p) => ({
        platform: p,
        caption: platformData[p].caption || null,
        title: platformData[p].title || null,
        description: platformData[p].description || null,
      }));

      const baseCaption =
        platformData[activeTabPlatform]?.caption ||
        platformData[selectedPlatforms[0]]?.caption ||
        title;

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        internalNotes: internalNotes.trim() || null,
        content: baseCaption,
        status: hasSchedule && status === "IDEA" ? "SCHEDULED" : status,
        priority,
        plannedAt: plannedAtIso,
        timezone: "Asia/Kolkata",
        campaignId: campaignId === "none" ? null : campaignId,
        contentPillarId: contentPillarId === "none" ? null : contentPillarId,
        platforms: platformsPayload,
        media: selectedMedia.map((m, idx) => ({
          fileId: m.fileId,
          displayOrder: idx,
          caption: m.caption || null,
        })),
        hashtagIds: selectedHashtagIds,
        reminderOffsets: hasSchedule ? reminderOffsets : [],
      };

      const url = post ? `/api/social/posts/${post.id}` : "/api/social/posts";
      const method = post ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save post");
      }

      const d = await res.json();
      onSuccess(d.post);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving post";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const activeMeta = getPlatformMeta(activeTabPlatform);
  const currentCaption = platformData[activeTabPlatform].caption;
  const isNearLimit = currentCaption.length > activeMeta.charLimit * 0.85;
  const isOverLimit = currentCaption.length > activeMeta.charLimit;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={post ? "Edit Social Post" : "Plan New Social Post"}
        description="Craft multi-platform captions, link media from File Manager, and schedule alerts."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Basic Meta Row: Title & Pillar & Campaign */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Post Title (Internal Reference) *</label>
              <input
                placeholder="e.g. Q4 Product Launch Teaser #1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Content Pillar</label>
              <select
                value={contentPillarId}
                onChange={(e) => setContentPillarId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="none">None / General</option>
                {pillars.map((pil) => (
                  <option key={pil.id} value={pil.id}>
                    {pil.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status, Priority & Campaign */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="none">No Campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Workflow Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SocialPostStatus)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="IDEA">Idea</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SocialPostPriority)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Target Platforms Picker */}
          <div className="space-y-2 p-3 rounded-lg bg-card/40 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Target Platforms</span>
              <span className="text-[11px] text-secondary-text">
                Select platforms to tailor captions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                const pMeta = getPlatformMeta(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      isSelected
                        ? `${pMeta.colorClass} shadow-sm font-semibold`
                        : "border-border/60 bg-card/40 text-secondary-text hover:text-foreground"
                    )}
                  >
                    <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
                    <span>{pMeta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform-Specific Tabbed Editor */}
          <div className="space-y-3 rounded-lg border border-border/80 bg-card/40 p-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-1 overflow-x-auto">
                {selectedPlatforms.map((p) => {
                  const pMeta = getPlatformMeta(p);
                  const isActive = activeTabPlatform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActiveTabPlatform(p)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                        isActive
                          ? "bg-white/[0.1] text-foreground font-semibold shadow-sm"
                          : "text-secondary-text hover:text-foreground"
                      )}
                    >
                      <PlatformIcon platform={p} className="h-3 w-3" />
                      <span>{pMeta.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedPlatforms.length > 1 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) copyFromPlatform(e.target.value as SocialPlatform);
                    }}
                    className="h-7 text-[11px] px-2 rounded bg-card/60 border border-border/80 text-secondary-text"
                    defaultValue=""
                  >
                    <option value="" disabled>Copy content from...</option>
                    {selectedPlatforms
                      .filter((p) => p !== activeTabPlatform)
                      .map((p) => (
                        <option key={p} value={p}>
                          {getPlatformMeta(p).label}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* YouTube Video Title if applicable */}
            {activeTabPlatform === "YOUTUBE" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-xs font-medium text-secondary-text">Video Title</label>
                  <span className="text-[10px] text-secondary-text font-mono">
                    {(platformData.YOUTUBE.title || "").length} / 100
                  </span>
                </div>
                <input
                  placeholder="Catchy YouTube video title..."
                  value={platformData.YOUTUBE.title}
                  onChange={(e) =>
                    setPlatformData((prev) => ({
                      ...prev,
                      YOUTUBE: { ...prev.YOUTUBE, title: e.target.value },
                    }))
                  }
                  maxLength={100}
                  className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Caption Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <PlatformIcon platform={activeTabPlatform} className="h-3.5 w-3.5" />
                  {activeMeta.label} Caption
                </span>
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    isOverLimit
                      ? "text-red-400 font-bold"
                      : isNearLimit
                      ? "text-amber-400"
                      : "text-secondary-text"
                  )}
                >
                  {currentCaption.length} / {activeMeta.charLimit} chars
                </span>
              </div>
              <textarea
                placeholder={`Write captivating caption for ${activeMeta.label}...`}
                value={currentCaption}
                onChange={(e) => updateCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px] resize-y leading-relaxed font-sans"
              />
            </div>

            {/* Hashtag Insertion Helper */}
            {hashtags.length > 0 && (
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-secondary-text flex items-center gap-1">
                    <Hash className="h-3 w-3 text-primary" /> Click hashtag to insert:
                  </span>
                  {collections.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-secondary-text text-[10px]">Insert Collection:</span>
                      {collections.slice(0, 3).map((coll) => (
                        <button
                          key={coll.id}
                          type="button"
                          onClick={() =>
                            insertHashtags((coll.hashtags || []).map((h) => h.displayTag))
                          }
                          className="text-[10px] px-1.5 py-0.5 rounded border border-border/80 bg-card/40 hover:bg-card text-purple-300 transition-colors"
                        >
                          {coll.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {hashtags.slice(0, 15).map((ht) => (
                    <button
                      key={ht.id}
                      type="button"
                      onClick={() => insertHashtags([ht.displayTag])}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border/80 bg-card/40 hover:border-primary/50 hover:text-primary transition-all text-secondary-text"
                    >
                      {ht.displayTag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Media Attachments Section */}
          <div className="space-y-3 p-3.5 rounded-lg border border-border/80 bg-card/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" /> Media Attachments
                </span>
                <p className="text-[11px] text-secondary-text mt-0.5">
                  Attach visual creatives from your File Manager without duplicate uploads.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMediaPickerOpen(true)}
                className="text-xs h-8 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Attach Media
              </Button>
            </div>

            {selectedMedia.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {selectedMedia.map((m, idx) => (
                  <div
                    key={m.fileId}
                    className="relative rounded-lg border border-border/80 bg-card/60 overflow-hidden group p-2 flex flex-col justify-between"
                  >
                    <div className="aspect-video w-full rounded overflow-hidden bg-black/40 flex items-center justify-center">
                      {m.file && m.file.mimeType.startsWith("image/") ? (
                        <img
                          src={`/api/files/${m.fileId}/preview`}
                          alt="media"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-[10px] text-secondary-text uppercase font-mono">
                          {m.file?.extension || "FILE"}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-secondary-text truncate max-w-[100px]">
                        {m.file?.originalName || `File ${idx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMedia(selectedMedia.filter((item) => item.fileId !== m.fileId))
                        }
                        className="text-secondary-text hover:text-red-400 p-0.5 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center text-xs text-[#737373] border border-[#292929] bg-[#181818]/60 rounded-lg">
                No media attached yet. Click &quot;Attach Media&quot; to pick images or videos.
              </div>
            )}
          </div>

          {/* Planning & Schedule Section */}
          <div className="space-y-3 p-3.5 rounded-lg border border-[#292929] bg-[#181818]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#A3A3A3]" />
                <div>
                  <span className="text-xs font-medium text-[#F5F5F5]">Publishing Schedule & Reminders</span>
                  <p className="text-[11px] text-[#737373]">
                    Schedule planned date and time in Asia/Kolkata (IST).
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasSchedule}
                  onChange={(e) => {
                    setHasSchedule(e.target.checked);
                    if (e.target.checked && status === "DRAFT") {
                      setStatus("SCHEDULED");
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-0"
                />
                <span>Set Schedule</span>
              </label>
            </div>

            {hasSchedule && (
              <div className="pt-2 space-y-3 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-secondary-text">Date</label>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required={hasSchedule}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-secondary-text">Time (IST)</label>
                    <input
                      type="time"
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required={hasSchedule}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] text-secondary-text uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Bell className="h-3 w-3 text-primary" /> Notify Me Before Publishing:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { offset: 0, label: "At scheduled time" },
                      { offset: 15, label: "15 mins before" },
                      { offset: 60, label: "1 hour before" },
                      { offset: 1440, label: "1 day before" },
                    ].map((opt) => {
                      const isChecked = reminderOffsets.includes(opt.offset);
                      return (
                        <button
                          key={opt.offset}
                          type="button"
                          onClick={() => toggleReminderOffset(opt.offset)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-md border transition-all",
                            isChecked
                              ? "bg-primary/20 border-primary text-primary font-medium"
                              : "bg-card/40 border-border/80 text-secondary-text hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes / Objective */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-secondary-text">Internal Notes & Strategy</label>
            <textarea
              placeholder="Notes on target audience, CTA, visual direction..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
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
              disabled={loading}
              className="text-xs"
            >
              {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {post ? "Update Post" : hasSchedule ? "Schedule Post" : "Save Draft"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        selectedMedia={selectedMedia}
        onConfirm={setSelectedMedia}
      />
    </>
  );
}
