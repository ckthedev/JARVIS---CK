"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Image as ImageIcon, Video, Check, Loader2, AlertCircle } from "lucide-react";
import { FileDto } from "@/modules/files/types";
import { cn } from "@/lib/utils";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedMedia: Array<{ fileId: string; displayOrder: number; caption?: string | null; file?: FileDto | null }>;
  onConfirm: (
    media: Array<{ fileId: string; displayOrder: number; caption?: string | null; file?: FileDto | null }>
  ) => void;
}

export function MediaPickerModal({
  open,
  onClose,
  selectedMedia,
  onConfirm,
}: MediaPickerModalProps) {
  const [files, setFiles] = useState<FileDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "IMAGE" | "VIDEO">("all");
  const [selectedMap, setSelectedMap] = useState<Map<string, { displayOrder: number; file: FileDto }>>(
    new Map()
  );

  useEffect(() => {
    if (open) {
      fetchFiles();
      const initialMap = new Map<string, { displayOrder: number; file: FileDto }>();
      selectedMedia.forEach((m) => {
        if (m.file) {
          initialMap.set(m.fileId, { displayOrder: m.displayOrder, file: m.file });
        }
      });
      setSelectedMap(initialMap);
    }
  }, [open, selectedMedia]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files?section=all&sortBy=createdAt&sortOrder=desc");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((f) => {
    const isImageOrVideo =
      f.category === "IMAGE" ||
      f.category === "VIDEO" ||
      f.mimeType.startsWith("image/") ||
      f.mimeType.startsWith("video/");
    if (!isImageOrVideo) return false;

    if (filterType === "IMAGE" && !f.mimeType.startsWith("image/")) return false;
    if (filterType === "VIDEO" && !f.mimeType.startsWith("video/")) return false;

    if (search.trim()) {
      return f.originalName.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const toggleSelect = (file: FileDto) => {
    const next = new Map(selectedMap);
    if (next.has(file.id)) {
      next.delete(file.id);
    } else {
      next.set(file.id, { displayOrder: next.size, file });
    }
    setSelectedMap(next);
  };

  const handleApply = () => {
    const result: Array<{ fileId: string; displayOrder: number; caption?: string | null; file: FileDto }> = [];
    let order = 0;
    for (const [fileId, info] of selectedMap.entries()) {
      const existing = selectedMedia.find((m) => m.fileId === fileId);
      result.push({
        fileId,
        displayOrder: order++,
        caption: existing?.caption || null,
        file: info.file,
      });
    }
    onConfirm(result);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Attach Media from File Manager"
      description="Select images or videos from your JARVIS File Manager to attach to this post. No duplicate uploads created."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
            <input
              placeholder="Search media files by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1 bg-card/60 p-1 rounded-md border border-border/80">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "h-7 px-2.5 rounded text-xs transition-colors",
                filterType === "all" ? "bg-white/[0.1] text-foreground font-semibold" : "text-secondary-text"
              )}
            >
              All Media
            </button>
            <button
              type="button"
              onClick={() => setFilterType("IMAGE")}
              className={cn(
                "h-7 px-2.5 rounded text-xs flex items-center gap-1 transition-colors",
                filterType === "IMAGE" ? "bg-white/[0.1] text-foreground font-semibold" : "text-secondary-text"
              )}
            >
              <ImageIcon className="h-3 w-3" /> Images
            </button>
            <button
              type="button"
              onClick={() => setFilterType("VIDEO")}
              className={cn(
                "h-7 px-2.5 rounded text-xs flex items-center gap-1 transition-colors",
                filterType === "VIDEO" ? "bg-white/[0.1] text-foreground font-semibold" : "text-secondary-text"
              )}
            >
              <Video className="h-3 w-3" /> Videos
            </button>
          </div>
        </div>

        {/* Files Grid */}
        <div className="max-h-[360px] min-h-[200px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-secondary-text gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading media files...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#737373] gap-2 border border-[#292929] bg-[#181818]/60 rounded-lg">
              <AlertCircle className="h-8 w-8 text-[#555555]" />
              <span className="text-sm font-medium text-[#F5F5F5]">No media files found</span>
              <span className="text-xs text-[#A3A3A3]">
                Upload images or videos in the File Manager (/files) first.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {filteredFiles.map((file) => {
                const isSelected = selectedMap.has(file.id);
                const isVideo = file.mimeType.startsWith("video/");

                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file)}
                    className={cn(
                      "relative group rounded-lg overflow-hidden border cursor-pointer transition-all aspect-square flex flex-col justify-between p-2",
                      isSelected
                        ? "border-[#454545] bg-[#343434]/40"
                        : "border-[#292929] bg-[#181818] hover:border-[#383838]"
                    )}
                  >
                    {/* Media Preview or Icon */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden rounded">
                      {file.mimeType.startsWith("image/") ? (
                        <img
                          src={`/api/files/${file.id}/preview`}
                          alt={file.originalName}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#737373] gap-1">
                          {isVideo ? (
                            <Video className="h-8 w-8 text-[#A3A3A3]" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-[#A3A3A3]" />
                          )}
                          <span className="text-[10px] uppercase font-mono">{file.extension}</span>
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    <div
                      className={cn(
                        "absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-[#383838] text-[#F5F5F5] border border-[#454545] font-bold text-xs"
                          : "bg-black/60 border border-white/20 text-transparent group-hover:border-white/50"
                      )}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>

                    {/* File Name & Size */}
                    <div className="mt-1 bg-black/60 backdrop-blur-sm -mx-2 -mb-2 p-1 px-1.5 rounded-b-lg">
                      <p className="text-[11px] font-medium truncate text-foreground/90">
                        {file.originalName}
                      </p>
                      <p className="text-[10px] text-secondary-text truncate">
                        {(file.sizeBytes / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/80 pt-3">
          <div className="text-xs text-secondary-text">
            {selectedMap.size} item{selectedMap.size === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2">
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
              type="button"
              size="sm"
              onClick={handleApply}
              className="text-xs"
            >
              Attach {selectedMap.size > 0 ? `(${selectedMap.size})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
