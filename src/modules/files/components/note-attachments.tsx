"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Paperclip,
  Upload,
  Download,
  X,
  Plus,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { NoteAttachmentDto, StoredFileDto } from "../types";
import { formatBytes } from "@/lib/storage/file-types";
import { FileCategoryIcon } from "./file-category-icon";

interface NoteAttachmentsProps {
  noteId: string;
  readOnly?: boolean;
}

export function NoteAttachments({ noteId, readOnly = false }: NoteAttachmentsProps) {
  const [attachments, setAttachments] = useState<NoteAttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<StoredFileDto[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/files/attachments?noteId=${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch (err) {
      console.error("Failed to fetch note attachments:", err);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleOpenPicker = async () => {
    setPickerOpen(true);
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/files?section=all");
      if (res.ok) {
        const data = await res.json();
        setAvailableFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files for picker:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleAttachExisting = async () => {
    if (!selectedFileId) return;
    setAttaching(true);
    try {
      const res = await fetch("/api/files/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, fileId: selectedFileId }),
      });
      if (res.ok) {
        setPickerOpen(false);
        setSelectedFileId(null);
        fetchAttachments();
      }
    } catch (err) {
      console.error("Failed to attach file:", err);
    } finally {
      setAttaching(false);
    }
  };

  const handleUploadAndAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("files", file);

      // 1. Upload to files
      const uploadRes = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const uploadedFile = uploadData.files?.[0];

      if (uploadedFile) {
        // 2. Attach to note
        await fetch("/api/files/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId, fileId: uploadedFile.id }),
        });
        fetchAttachments();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload and attach file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDetach = async (fileId: string) => {
    try {
      const res = await fetch("/api/files/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, fileId }),
      });
      if (res.ok) {
        fetchAttachments();
      }
    } catch (err) {
      console.error("Failed to detach file:", err);
    }
  };

  const handleDownload = (file: StoredFileDto) => {
    const a = document.createElement("a");
    a.href = `/api/files/${file.id}/download`;
    a.download = file.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Exclude files already attached
  const attachedFileIds = new Set(attachments.map((a) => a.fileId));
  const unattachedFiles = availableFiles.filter((f) => !attachedFileIds.has(f.id));

  return (
    <div className="rounded-lg border border-[#292929] bg-[#181818] p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-medium text-[#F5F5F5]">
          <Paperclip className="h-3.5 w-3.5 text-[#A3A3A3]" />
          <span>Attachments ({attachments.length})</span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadAndAttach}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-6 text-[11px] gap-1 px-2 border border-[#303030] bg-[#202020] text-[#F5F5F5] hover:bg-[#252525]"
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin text-[#A3A3A3]" />
              ) : (
                <Upload className="h-3 w-3 text-[#A3A3A3]" />
              )}
              <span>Upload New</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenPicker}
              className="h-6 text-[11px] gap-1 px-2 border border-[#303030] bg-[#202020] text-[#F5F5F5] hover:bg-[#252525]"
            >
              <FolderOpen className="h-3 w-3 text-[#A3A3A3]" />
              <span>Attach File</span>
            </Button>
          </div>
        )}
      </div>

      {/* Attachment List */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[#737373] py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A3A3A3]" />
          <span>Loading attachments...</span>
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-[11px] text-[#737373] italic py-1">
          No files attached to this note yet. Click &ldquo;Attach File&rdquo; or &ldquo;Upload New&rdquo; to link assets.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 rounded-md bg-[#202020] border border-[#292929] text-xs gap-2"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <FileCategoryIcon
                  category={att.file.category}
                  extension={att.file.extension}
                  className="h-4 w-4 shrink-0"
                />
                <div className="truncate min-w-0">
                  <span className="font-medium text-foreground truncate block" title={att.file.originalName}>
                    {att.file.originalName}
                  </span>
                  <span className="text-[10px] text-secondary-text font-mono">
                    {formatBytes(att.file.sizeBytes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(att.file)}
                  className="p-1 rounded text-secondary-text hover:text-primary transition-colors"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDetach(att.file.id)}
                    className="p-1 rounded text-secondary-text hover:text-red-400 transition-colors"
                    title="Detach from note"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attach File from JARVIS Dialog */}
      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Attach Existing File"
        maxWidth="md"
      >
        <div className="space-y-3 my-2">
          <p className="text-xs text-secondary-text">
            Choose a file from your JARVIS File Manager to attach to this note:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {loadingFiles ? (
              <div className="flex items-center justify-center py-8 gap-2 text-xs text-secondary-text">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading files...</span>
              </div>
            ) : unattachedFiles.length === 0 ? (
              <p className="text-xs text-secondary-text text-center py-6 italic">
                No files available to attach.
              </p>
            ) : (
              unattachedFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedFileId === file.id
                      ? "border-[#404040] bg-[#343434] text-[#F5F5F5] font-medium"
                      : "border-[#292929] bg-[#181818] text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F5F5F5]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCategoryIcon
                      category={file.category}
                      extension={file.extension}
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="truncate">{file.originalName}</span>
                  </div>
                  <span className="text-[10px] text-[#737373] font-mono shrink-0">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292929]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(false)}
              className="border-[#303030] bg-transparent text-[#A3A3A3] hover:text-[#F5F5F5] text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAttachExisting}
              disabled={!selectedFileId || attaching}
              className="bg-[#383838] text-[#F5F5F5] font-medium hover:bg-[#454545] text-xs gap-1.5"
            >
              {attaching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              <span>Attach File</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
