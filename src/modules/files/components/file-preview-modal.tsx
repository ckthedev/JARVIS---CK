"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  FileQuestion,
  Loader2,
  FileCode,
  ShieldAlert,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoredFileDto } from "../types";
import { formatBytes } from "@/lib/storage/file-types";
import { FileCategoryIcon } from "./file-category-icon";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: StoredFileDto | null;
  onDownload: (file: StoredFileDto) => void;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  file,
  onDownload,
}: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  const ext = file?.extension?.toLowerCase() || "";
  const isImage = file?.category === "IMAGE";
  const isVideo = file?.category === "VIDEO";
  const isAudio = file?.category === "AUDIO";
  const isPdf = ext === "pdf";
  const isCodeOrText =
    file?.category === "CODE" ||
    ext === "txt" ||
    ext === "md" ||
    ext === "json" ||
    ext === "xml" ||
    ext === "sql" ||
    ext === "yaml" ||
    ext === "yml";

  useEffect(() => {
    if (open && file && isCodeOrText) {
      setLoadingText(true);
      setTextError(null);
      setTextContent(null);

      fetch(`/api/files/${file.id}/preview`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load text preview");
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch((err) => {
          setTextError(err instanceof Error ? err.message : "Error reading file content");
          setLoadingText(false);
        });
    }
  }, [open, file, isCodeOrText]);

  if (!file) return null;

  const previewUrl = `/api/files/${file.id}/preview`;

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="2xl"
      className="p-0 overflow-hidden bg-[#080D16] border-border"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-[#0D1421] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <FileCategoryIcon category={file.category} extension={file.extension} className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate" title={file.originalName}>
              {file.originalName}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-secondary-text">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase font-mono border-border bg-[#111B2B]">
                {file.category}
              </Badge>
              <span>&bull;</span>
              <span className="font-mono">{formatBytes(file.sizeBytes)}</span>
              {file.folder && (
                <>
                  <span>&bull;</span>
                  <span className="truncate">{file.folder.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-8">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(file)}
            className="h-8 gap-1.5 border-border bg-[#111B2B] text-xs hover:border-primary/50"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* Center Content Preview */}
      <div className="min-h-[50vh] max-h-[75vh] overflow-auto bg-[#080D16] p-4 flex items-center justify-center">
        {/* Images */}
        {isImage && (
          <div className="relative max-h-full max-w-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={file.originalName}
              className="max-h-[65vh] max-w-full object-contain rounded-md shadow-lg"
            />
          </div>
        )}

        {/* Videos */}
        {isVideo && (
          <div className="w-full max-w-3xl flex items-center justify-center">
            <video
              controls
              autoPlay={false}
              src={previewUrl}
              className="max-h-[65vh] w-full rounded-lg bg-black shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Audio */}
        {isAudio && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl bg-[#0D1421] border border-border shadow-xl max-w-md w-full">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400">
              <FileCategoryIcon category="AUDIO" className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-semibold text-foreground truncate max-w-xs">{file.originalName}</h4>
              <p className="text-xs text-secondary-text font-mono mt-0.5">{formatBytes(file.sizeBytes)}</p>
            </div>
            <audio controls src={previewUrl} className="w-full mt-2">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* PDF Viewer */}
        {isPdf && (
          <div className="h-[65vh] w-full rounded-lg overflow-hidden border border-border">
            <iframe
              src={`${previewUrl}#toolbar=1`}
              title={file.originalName}
              className="h-full w-full rounded-lg bg-white"
            />
          </div>
        )}

        {/* Code / Text Viewer */}
        {isCodeOrText && !isPdf && (
          <div className="h-[65vh] w-full flex flex-col rounded-lg border border-border bg-[#0D1421] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/80 bg-[#111B2B] text-xs text-secondary-text">
              <div className="flex items-center gap-1.5 font-mono">
                <FileCode className="h-3.5 w-3.5 text-blue-400" />
                <span>Previewing code / text</span>
              </div>
              {Boolean(file.metadata?.isExecutable) && (
                <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Script execution isolated</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground/90 select-text whitespace-pre">
              {loadingText ? (
                <div className="flex items-center justify-center h-48 gap-2 text-secondary-text">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading file contents...</span>
                </div>
              ) : textError ? (
                <div className="flex items-center justify-center h-48 text-red-400 text-xs">
                  {textError}
                </div>
              ) : (
                textContent || "(Empty file)"
              )}
            </div>
          </div>
        )}

        {/* Unsupported Formats Fallback */}
        {!isImage && !isVideo && !isAudio && !isPdf && !isCodeOrText && (
          <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-[#0D1421] border border-border max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="p-4 rounded-full bg-[#111B2B] text-secondary-text">
              <FileQuestion className="h-10 w-10 text-secondary-text" />
            </div>

            <div>
              <h4 className="text-base font-semibold text-foreground truncate max-w-xs">{file.originalName}</h4>
              <p className="text-xs text-secondary-text mt-1">
                Preview is not available for this file type ({file.extension ? `.${file.extension}` : "binary"}).
              </p>
            </div>

            <div className="w-full bg-[#111B2B] rounded-lg p-3 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-secondary-text">
                <span>File Size:</span>
                <span className="font-mono text-foreground">{formatBytes(file.sizeBytes)}</span>
              </div>
              <div className="flex justify-between text-secondary-text">
                <span>MIME Type:</span>
                <span className="font-mono text-foreground truncate max-w-[200px]">{file.mimeType}</span>
              </div>
              {file.checksum && (
                <div className="flex justify-between text-secondary-text">
                  <span>SHA-256:</span>
                  <span className="font-mono text-foreground text-[10px] truncate max-w-[180px]" title={file.checksum}>
                    {file.checksum.substring(0, 16)}...
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={() => onDownload(file)}
              className="w-full bg-primary text-black font-medium hover:bg-primary/90 text-xs gap-1.5 shadow-md shadow-primary/20"
            >
              <Download className="h-4 w-4" />
              <span>Download Original File</span>
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
