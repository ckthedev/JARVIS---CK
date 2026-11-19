"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Pin,
  Send,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { NoteDto } from "@/modules/notes/types";

interface DashboardQuickIdeasProps {
  initialNotes: NoteDto[];
}

export function DashboardQuickIdeas({ initialNotes }: DashboardQuickIdeasProps) {
  const [notes, setNotes] = useState<NoteDto[]>(initialNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    const noteTitle = title.trim() || "Quick Idea";
    const noteContent = content.trim();

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          content: `<p>${noteContent}</p>`,
          plainText: noteContent,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save note");
      }

      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev.slice(0, 5)]);
        setTitle("");
        setContent("");
        setFeedback("Idea captured successfully!");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setFeedback("Failed to capture idea. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">
            Quick Notes &amp; Ideas
          </h2>
        </div>

        <Link
          href="/notes"
          className="flex items-center gap-1 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
        >
          <span>Open Notes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Inline Quick Capture Form */}
      <form onSubmit={handleSubmit} className="mt-3.5 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Idea or note title..."
          className="w-full rounded-lg border border-[#303030] bg-[#181818] px-3 py-1.5 text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:border-[#454545] focus:outline-none transition-colors"
        />

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder="Capture context, thought or link..."
            className="w-full resize-none rounded-lg border border-[#303030] bg-[#181818] px-3 py-1.5 text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:border-[#454545] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          {feedback ? (
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                feedback.includes("Failed") ? "text-[#EF4444]" : "text-[#D4D4D4]"
              }`}
            >
              <CheckCircle className="h-3 w-3" />
              {feedback}
            </span>
          ) : (
            <span className="text-[10px] text-[#737373]">
              Synced to your personal notes
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (!title.trim() && !content.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#383838] hover:bg-[#454545] border border-[#484848]/40 disabled:opacity-40 text-[#F5F5F5] px-3 py-1 text-xs font-medium shadow-sm transition-all"
          >
            <Send className="h-3 w-3" />
            <span>{isSubmitting ? "Saving..." : "Save Idea"}</span>
          </button>
        </div>
      </form>

      {/* Recent Notes Preview */}
      <div className="mt-4 pt-3 border-t border-[#292929] space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
          Recent &amp; Pinned Ideas
        </div>

        {notes.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#737373]">
            No notes captured yet. Use the form above to record your first thought.
          </div>
        ) : (
          notes.slice(0, 4).map((note) => {
            const preview =
              note.plainText ||
              note.content?.replace(/<[^>]+>/g, "") ||
              "Empty note";

            return (
              <Link
                key={note.id}
                href={`/notes?id=${note.id}`}
                className="group flex items-start justify-between gap-2.5 rounded-lg border border-[#292929] bg-[#181818] p-2.5 transition-all hover:bg-[#242424] hover:border-[#383838]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {note.isPinned && (
                      <Pin className="h-3 w-3 text-[#A3A3A3] shrink-0" />
                    )}
                    <span className="text-xs font-medium text-[#F5F5F5] group-hover:text-[#FFFFFF] transition-colors truncate">
                      {note.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#737373] line-clamp-1">
                    {preview}
                  </p>
                </div>

                <span className="text-[10px] text-[#737373] shrink-0 pt-0.5">
                  {formatRelativeTime(note.updatedAt)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
