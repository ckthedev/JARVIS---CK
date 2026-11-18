"use client";

import React from "react";
import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Pin,
  AtSign,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SocialPlatform,
  SocialPostStatus,
  SocialPostPriority,
  ContentPillarDto,
} from "../types";

export const ALL_PLATFORMS: SocialPlatform[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "PINTEREST",
  "THREADS",
  "YOUTUBE",
];

export function getPlatformMeta(platform: SocialPlatform) {
  switch (platform) {
    case "INSTAGRAM":
      return {
        label: "Instagram",
        icon: Instagram,
        colorClass: "bg-pink-500/15 text-pink-400 border-pink-500/30",
        accentHex: "#E1306C",
        charLimit: 2200,
      };
    case "FACEBOOK":
      return {
        label: "Facebook",
        icon: Facebook,
        colorClass: "bg-blue-600/15 text-blue-400 border-blue-600/30",
        accentHex: "#1877F2",
        charLimit: 63206,
      };
    case "LINKEDIN":
      return {
        label: "LinkedIn",
        icon: Linkedin,
        colorClass: "bg-sky-600/15 text-sky-400 border-sky-600/30",
        accentHex: "#0A66C2",
        charLimit: 3000,
      };
    case "PINTEREST":
      return {
        label: "Pinterest",
        icon: Pin,
        colorClass: "bg-red-600/15 text-red-400 border-red-600/30",
        accentHex: "#BD081C",
        charLimit: 500,
      };
    case "THREADS":
      return {
        label: "Threads",
        icon: AtSign,
        colorClass: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
        accentHex: "#FFFFFF",
        charLimit: 500,
      };
    case "YOUTUBE":
      return {
        label: "YouTube",
        icon: Youtube,
        colorClass: "bg-red-500/15 text-red-400 border-red-500/30",
        accentHex: "#FF0000",
        charLimit: 5000,
      };
    default:
      return {
        label: platform,
        icon: Share2,
        colorClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
        accentHex: "#7A3FFF",
        charLimit: 2000,
      };
  }
}

export function PlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const meta = getPlatformMeta(platform);
  const Icon = meta.icon;
  return <Icon className={className || "h-4 w-4"} />;
}

export function PlatformBadge({
  platform,
  showLabel = true,
  className,
}: {
  platform: SocialPlatform;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = getPlatformMeta(platform);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        meta.colorClass,
        className
      )}
      title={meta.label}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}

export function PostStatusBadge({
  status,
  className,
}: {
  status: SocialPostStatus;
  className?: string;
}) {
  switch (status) {
    case "IDEA":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-slate-500/10 text-slate-400 border-slate-500/30 font-medium",
            className
          )}
        >
          Idea
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-blue-500/10 text-blue-400 border-blue-500/30 font-medium",
            className
          )}
        >
          Draft
        </Badge>
      );
    case "IN_REVIEW":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-amber-500/10 text-amber-400 border-amber-500/30 font-medium",
            className
          )}
        >
          In Review
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium",
            className
          )}
        >
          Approved
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-medium",
            className
          )}
        >
          Scheduled
        </Badge>
      );
    case "PUBLISHED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-green-500/10 text-green-400 border-green-500/30 font-medium",
            className
          )}
        >
          Published
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-rose-500/10 text-rose-400 border-rose-500/30 font-medium",
            className
          )}
        >
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: SocialPostPriority;
  className?: string;
}) {
  switch (priority) {
    case "HIGH":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] uppercase tracking-wider font-semibold",
            className
          )}
        >
          High
        </Badge>
      );
    case "NORMAL":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-slate-500/10 text-slate-400 border-slate-500/20 text-[10px] uppercase tracking-wider",
            className
          )}
        >
          Normal
        </Badge>
      );
    case "LOW":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px] uppercase tracking-wider",
            className
          )}
        >
          Low
        </Badge>
      );
  }
}

export function ContentPillarBadge({
  pillar,
  className,
}: {
  pillar?: ContentPillarDto | null;
  className?: string;
}) {
  if (!pillar) return null;
  const col = pillar.color || "#00D4FF";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-white/[0.03]",
        className
      )}
      style={{
        borderColor: `${col}40`,
        color: col,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: col }}
      />
      <span>{pillar.name}</span>
    </span>
  );
}
