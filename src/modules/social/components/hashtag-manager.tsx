"use client";

import React, { useState, useEffect } from "react";
import {
  Hash,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Search,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HashtagDto, HashtagCollectionDto } from "../types";
import { cn } from "@/lib/utils";

export function HashtagManager() {
  const [hashtags, setHashtags] = useState<HashtagDto[]>([]);
  const [collections, setCollections] = useState<HashtagCollectionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hashtag Dialog
  const [htDialogOpen, setHtDialogOpen] = useState(false);
  const [editingHt, setEditingHt] = useState<HashtagDto | null>(null);
  const [htTagInput, setHtTagInput] = useState("");
  const [htCategoryInput, setHtCategoryInput] = useState("");
  const [htNotesInput, setHtNotesInput] = useState("");
  const [htSaving, setHtSaving] = useState(false);
  const [htError, setHtError] = useState<string | null>(null);

  // Collection Dialog
  const [collDialogOpen, setCollDialogOpen] = useState(false);
  const [editingColl, setEditingColl] = useState<HashtagCollectionDto | null>(null);
  const [collName, setCollName] = useState("");
  const [collDesc, setCollDesc] = useState("");
  const [collColor, setCollColor] = useState("#7A3FFF");
  const [collHashtagIds, setCollHashtagIds] = useState<string[]>([]);
  const [collSaving, setCollSaving] = useState(false);
  const [collError, setCollError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [htRes, collRes] = await Promise.all([
        fetch("/api/social/hashtags"),
        fetch("/api/social/hashtags/collections"),
      ]);
      if (htRes.ok) {
        const d = await htRes.json();
        setHashtags(d.hashtags || []);
      }
      if (collRes.ok) {
        const d = await collRes.json();
        setCollections(d.collections || []);
      }
    } catch (err) {
      console.error("Failed to load hashtags:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // HASHTAG CRUD
  const openCreateHt = () => {
    setEditingHt(null);
    setHtTagInput("");
    setHtCategoryInput("");
    setHtNotesInput("");
    setHtError(null);
    setHtDialogOpen(true);
  };

  const openEditHt = (ht: HashtagDto) => {
    setEditingHt(ht);
    setHtTagInput(ht.displayTag);
    setHtCategoryInput(ht.category || "");
    setHtNotesInput(ht.notes || "");
    setHtError(null);
    setHtDialogOpen(true);
  };

  const handleSaveHt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htTagInput.trim()) {
      setHtError("Hashtag is required.");
      return;
    }

    setHtSaving(true);
    setHtError(null);

    try {
      const payload = {
        displayTag: htTagInput.trim(),
        category: htCategoryInput.trim() || null,
        notes: htNotesInput.trim() || null,
      };

      const url = editingHt ? `/api/social/hashtags/${editingHt.id}` : "/api/social/hashtags";
      const method = editingHt ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save hashtag");
      }

      setHtDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving hashtag";
      setHtError(msg);
    } finally {
      setHtSaving(false);
    }
  };

  const handleDeleteHt = async (id: string, tag: string) => {
    if (confirm(`Delete hashtag ${tag}?`)) {
      try {
        const res = await fetch(`/api/social/hashtags/${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
      } catch (err) {
        console.error("Failed to delete hashtag:", err);
      }
    }
  };

  // COLLECTION CRUD
  const openCreateColl = () => {
    setEditingColl(null);
    setCollName("");
    setCollDesc("");
    setCollColor("#7A3FFF");
    setCollHashtagIds([]);
    setCollError(null);
    setCollDialogOpen(true);
  };

  const openEditColl = (coll: HashtagCollectionDto) => {
    setEditingColl(coll);
    setCollName(coll.name);
    setCollDesc(coll.description || "");
    setCollColor(coll.color || "#7A3FFF");
    setCollHashtagIds((coll.hashtags || []).map((h) => h.id));
    setCollError(null);
    setCollDialogOpen(true);
  };

  const handleSaveColl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collName.trim()) {
      setCollError("Collection name is required.");
      return;
    }

    setCollSaving(true);
    setCollError(null);

    try {
      const payload = {
        name: collName.trim(),
        description: collDesc.trim() || null,
        color: collColor,
        hashtagIds: collHashtagIds,
      };

      const url = editingColl
        ? `/api/social/hashtags/collections/${editingColl.id}`
        : "/api/social/hashtags/collections";
      const method = editingColl ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save collection");
      }

      setCollDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving collection";
      setCollError(msg);
    } finally {
      setCollSaving(false);
    }
  };

  const handleDeleteColl = async (id: string, name: string) => {
    if (confirm(`Delete hashtag collection "${name}"?`)) {
      try {
        const res = await fetch(`/api/social/hashtags/collections/${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
      } catch (err) {
        console.error("Failed to delete collection:", err);
      }
    }
  };

  const toggleCollHashtag = (htId: string) => {
    if (collHashtagIds.includes(htId)) {
      setCollHashtagIds(collHashtagIds.filter((id) => id !== htId));
    } else {
      setCollHashtagIds([...collHashtagIds, htId]);
    }
  };

  const categories = Array.from(
    new Set(hashtags.map((h) => h.category).filter(Boolean))
  ) as string[];

  const filteredHashtags = hashtags.filter((h) => {
    if (categoryFilter !== "all" && h.category !== categoryFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        h.tag.toLowerCase().includes(term) ||
        h.displayTag.toLowerCase().includes(term) ||
        Boolean(h.category && h.category.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* HASHTAG COLLECTIONS SECTION */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c1320]">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Hashtag Collections</h2>
              <p className="text-xs text-muted-foreground">
                Grouped tag presets for 1-click clipboard copying or post insertion.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={openCreateColl}
            className="text-xs gap-1.5 h-8 bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New Collection
          </Button>
        </div>

        {collections.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-white/[0.08] rounded-xl">
            No hashtag collections yet. Create a collection to bundle related tags together.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((coll) => {
              const tags = coll.hashtags || [];
              const allTagsString = tags.map((h) => h.displayTag).join(" ");
              const isCopied = copiedId === coll.id;
              const colorVal = coll.color || "#7A3FFF";

              return (
                <div
                  key={coll.id}
                  className="rounded-xl border border-white/[0.08] bg-[#0c1320] p-4 flex flex-col justify-between hover:border-white/[0.18] transition-all space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: colorVal }}
                        />
                        <h3 className="font-semibold text-sm text-foreground">{coll.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white/[0.03]">
                        {coll.hashtagCount} tags
                      </Badge>
                    </div>

                    {coll.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {coll.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                      {tags.map((h) => (
                        <span
                          key={h.id}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-foreground/80 font-mono"
                        >
                          {h.displayTag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(allTagsString, coll.id)}
                      className="text-xs h-7 gap-1.5"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-primary" />
                          <span>Copy All Tags</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditColl(coll)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteColl(coll.id, coll.name)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* HASHTAG LIBRARY SECTION */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c1320]">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Hashtag Library</h2>
              <p className="text-xs text-muted-foreground">
                All saved tags with usage tracking and categorization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-48"
              />
            </div>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <Button
              size="sm"
              onClick={openCreateHt}
              className="text-xs gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add Tag
            </Button>
          </div>
        </div>

        {/* Hashtags Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading hashtags...</span>
          </div>
        ) : filteredHashtags.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-white/[0.08] rounded-xl">
            No hashtags found matching filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {filteredHashtags.map((ht) => {
              const isCopied = copiedId === ht.id;
              return (
                <div
                  key={ht.id}
                  className="rounded-lg border border-white/[0.08] bg-[#0c1320] p-2.5 flex flex-col justify-between hover:border-white/[0.18] transition-all group"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-xs text-primary font-mono truncate">
                      {ht.displayTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ht.displayTag, ht.id)}
                      className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                      title="Copy hashtag"
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-white/[0.04] pt-1.5">
                    <span className="truncate max-w-[80px]">
                      {ht.category || "General"}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEditHt(ht)}
                        className="hover:text-foreground"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHt(ht.id, ht.displayTag)}
                        className="hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HASHTAG DIALOG */}
      <Dialog
        open={htDialogOpen}
        onClose={() => setHtDialogOpen(false)}
        title={editingHt ? "Edit Hashtag" : "Add Hashtag"}
        description="Enter hashtag with or without the leading # symbol."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveHt} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Hashtag *</label>
              <input
                placeholder="e.g. #WebDevelopment or AI"
                value={htTagInput}
                onChange={(e) => setHtTagInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Category</label>
              <input
                placeholder="e.g. Tech, Marketing, Lifestyle"
                value={htCategoryInput}
                onChange={(e) => setHtCategoryInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Notes</label>
              <input
                placeholder="Optional usage tips..."
                value={htNotesInput}
                onChange={(e) => setHtNotesInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {htError && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {htError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHtDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={htSaving}
              className="text-xs"
            >
              {htSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {editingHt ? "Save Changes" : "Add Hashtag"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* COLLECTION DIALOG */}
      <Dialog
        open={collDialogOpen}
        onClose={() => setCollDialogOpen(false)}
        title={editingColl ? "Edit Collection" : "New Hashtag Collection"}
        description="Group hashtags together for batch insertion into social posts."
        maxWidth="md"
      >
        <form onSubmit={handleSaveColl} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Collection Name *</label>
              <input
                placeholder="e.g. AI & Tech Stack"
                value={collName}
                onChange={(e) => setCollName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Description</label>
              <input
                placeholder="e.g. Tags for artificial intelligence posts"
                value={collDesc}
                onChange={(e) => setCollDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Tag Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary-text">
                Select Hashtags ({collHashtagIds.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto p-2 rounded-lg border border-border/80 bg-card/40 flex flex-wrap gap-1.5">
                {hashtags.map((h) => {
                  const isChecked = collHashtagIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleCollHashtag(h.id)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-mono border transition-all",
                        isChecked
                          ? "bg-purple-600/20 text-purple-300 border-purple-500/50 font-medium"
                          : "bg-card/40 border-border/80 text-secondary-text hover:text-foreground"
                      )}
                    >
                      {h.displayTag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {collError && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {collError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCollDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={collSaving}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
            >
              {collSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {editingColl ? "Save Changes" : "Create Collection"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
