"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Folder as FolderIcon,
  Loader2,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderDto } from "../types";
import { formatBytes } from "@/lib/storage/file-types";
import { cn } from "@/lib/utils";

interface UploadFileItem {
  id: string;
  file: File;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
  xhr?: XMLHttpRequest;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderDto[];
  defaultFolderId: string | null;
  onUploadSuccess: () => void;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  folders,
  defaultFolderId,
  onUploadSuccess,
}: FileUploadDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId);
  const [uploadQueue, setUploadQueue] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default folder when opened
  useEffect(() => {
    if (open) {
      setSelectedFolderId(defaultFolderId);
      setUploadQueue([]);
      setIsUploading(false);
    }
  }, [open, defaultFolderId]);

  const addFilesToQueue = (newFiles: FileList | File[]) => {
    const items: UploadFileItem[] = Array.from(newFiles).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      progress: 0,
      status: "idle",
    }));

    setUploadQueue((prev) => [...prev, ...items]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      e.target.value = "";
    }
  };

  const removeFileFromQueue = (id: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.xhr) {
        item.xhr.abort();
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const startUpload = async () => {
    if (uploadQueue.length === 0 || isUploading) return;

    setIsUploading(true);
    let anySuccess = false;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === "success") continue;

      setUploadQueue((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading", progress: 0 } : f))
      );

      try {
        await uploadSingleFile(item, selectedFolderId);
        setUploadQueue((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success", progress: 100 } : f))
        );
        anySuccess = true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setUploadQueue((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: message } : f))
        );
      }
    }

    setIsUploading(false);
    if (anySuccess) {
      onUploadSuccess();
    }
  };

  const uploadSingleFile = (item: UploadFileItem, folderId: string | null): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      item.xhr = xhr;

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadQueue((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: percentComplete } : f))
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      const formData = new FormData();
      formData.append("files", item.file);
      if (folderId) {
        formData.append("folderId", folderId);
      }

      xhr.open("POST", "/api/files");
      xhr.send(formData);
    });
  };

  const hasPending = uploadQueue.some((f) => f.status === "idle" || f.status === "error");
  const allCompleted = uploadQueue.length > 0 && uploadQueue.every((f) => f.status === "success");

  return (
    <Dialog
      open={open}
      onClose={() => !isUploading && onOpenChange(false)}
      title="Upload Files"
      description="Upload single or multiple files into your secure local storage."
      maxWidth="lg"
    >
      <div className="space-y-4 my-2">
        {/* Target Folder Selector */}
        <div className="flex items-center justify-between gap-3 bg-[#181818] p-2.5 rounded-lg border border-[#292929]">
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            <FolderIcon className="h-4 w-4 text-[#A3A3A3]" />
            <span>Upload to folder:</span>
          </div>
          <select
            value={selectedFolderId || ""}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            disabled={isUploading}
            className="bg-[#141414] text-[#F5F5F5] text-xs rounded border border-[#303030] px-2 py-1 focus:outline-none focus:border-[#454545] cursor-pointer max-w-[200px]"
          >
            <option value="">Root (No folder)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-6 border rounded-lg transition-colors cursor-pointer text-center",
            isDragging
              ? "border-[#454545] bg-[#242424]"
              : "border-[#303030] hover:border-[#404040] bg-[#181818] hover:bg-[#202020]"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
          <div className="p-3 rounded-full bg-[#202020] border border-[#303030] text-[#A3A3A3] mb-3">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-[#F5F5F5] mb-1">
            Drag and drop files here, or <span className="text-[#A3A3A3] underline hover:text-[#F5F5F5]">browse</span>
          </p>
          <p className="text-xs text-secondary-text">
            Supports any file format up to 100 MB per file.
          </p>
        </div>

        {/* Upload Queue List */}
        {uploadQueue.length > 0 && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-secondary-text px-1">
              <span>Selected files ({uploadQueue.length})</span>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setUploadQueue([])}
                  className="text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 p-2 rounded bg-[#181818] border border-[#292929] text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-[#A3A3A3] shrink-0" />
                    <span className="font-medium truncate text-[#F5F5F5]" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className="text-[#737373] font-mono text-[11px] shrink-0">
                      ({formatBytes(item.file.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "uploading" && (
                      <div className="flex items-center gap-1 text-[#A3A3A3]">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="font-mono text-[11px]">{item.progress}%</span>
                      </div>
                    )}
                    {item.status === "success" && (
                      <div className="flex items-center gap-1 text-[#A3A3A3]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Uploaded</span>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="flex items-center gap-1 text-[#EF4444]" title={item.error}>
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[120px]">{item.error || "Failed"}</span>
                      </div>
                    )}

                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFileFromQueue(item.id)}
                        className="text-[#737373] hover:text-[#EF4444] p-0.5 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {item.status === "uploading" && (
                  <div className="w-full bg-[#141414] border border-[#292929] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#A3A3A3] h-full transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292929]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="border-[#303030] bg-transparent text-[#A3A3A3] hover:text-[#F5F5F5] text-xs"
          >
            {allCompleted ? "Done" : "Cancel"}
          </Button>

          {hasPending && (
            <Button
              type="button"
              onClick={startUpload}
              disabled={isUploading}
              className="bg-[#383838] text-[#F5F5F5] font-medium hover:bg-[#454545] text-xs gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Start Upload ({uploadQueue.filter((f) => f.status !== "success").length})</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
