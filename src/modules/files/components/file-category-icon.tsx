import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Table,
  Presentation,
  Archive,
  Code,
  File,
} from "lucide-react";
import { FileCategory } from "@/lib/storage/file-types";
import { cn } from "@/lib/utils";

interface FileCategoryIconProps {
  category: FileCategory;
  extension?: string | null;
  className?: string;
}

export function FileCategoryIcon({ category, className }: FileCategoryIconProps) {
  const iconClass = cn("h-5 w-5 shrink-0", className);

  switch (category) {
    case "IMAGE":
      return <ImageIcon className={cn(iconClass, "text-cyan-400")} />;
    case "VIDEO":
      return <Video className={cn(iconClass, "text-purple-400")} />;
    case "AUDIO":
      return <Music className={cn(iconClass, "text-emerald-400")} />;
    case "DOCUMENT":
      return <FileText className={cn(iconClass, "text-amber-400")} />;
    case "SPREADSHEET":
      return <Table className={cn(iconClass, "text-emerald-400")} />;
    case "PRESENTATION":
      return <Presentation className={cn(iconClass, "text-rose-400")} />;
    case "ARCHIVE":
      return <Archive className={cn(iconClass, "text-amber-500")} />;
    case "CODE":
      return <Code className={cn(iconClass, "text-blue-400")} />;
    default:
      return <File className={cn(iconClass, "text-slate-400")} />;
  }
}
