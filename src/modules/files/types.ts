import { FileCategory } from "@/lib/storage/file-types";

export type { FileCategory };

export type FileViewSection =
  | "all"
  | "recent"
  | "images"
  | "videos"
  | "audio"
  | "documents"
  | "spreadsheets"
  | "presentations"
  | "archives"
  | "code"
  | "other"
  | "folder"
  | "trash";

export interface FolderDto {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  color: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fileCount?: number;
  subfolderCount?: number;
}

export interface FolderBreadcrumb {
  id: string;
  name: string;
}

export interface StoredFileDto {
  id: string;
  userId: string;
  folderId: string | null;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  extension: string | null;
  category: FileCategory;
  checksum: string | null;
  metadata: Record<string, unknown> | null;
  deletedAt: Date | null;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  folder?: FolderDto | null;
  isPreviewable: boolean;
}

// Backward compatibility alias for existing callers
export type FileDto = StoredFileDto;

export interface FileFilters {
  section?: FileViewSection;
  folderId?: string | null;
  search?: string;
  category?: FileCategory;
  sortBy?: "name" | "createdAt" | "sizeBytes";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface StorageOverviewStats {
  totalFiles: number;
  totalBytes: number;
  totalFolders: number;
  imagesBytes: number;
  videosBytes: number;
  audioBytes: number;
  documentsBytes: number;
  spreadsheetsBytes: number;
  presentationsBytes: number;
  archivesBytes: number;
  codeBytes: number;
  otherBytes: number;
  trashCount: number;
  trashBytes: number;
  isHealthy: boolean;
}

export interface NoteAttachmentDto {
  id: string;
  noteId: string;
  fileId: string;
  createdAt: Date;
  file: StoredFileDto;
}
