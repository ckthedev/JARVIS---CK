export type NoteViewSection =
  | "all"
  | "pinned"
  | "category"
  | "tag"
  | "archived"
  | "trash";

export interface NoteCategoryDto {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  noteCount?: number;
}

export interface NoteTagDto {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt?: Date;
  noteCount?: number;
}

export interface NoteDto {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  content: string;
  plainText: string;
  isPinned: boolean;
  isArchived: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: NoteCategoryDto | null;
  tags: NoteTagDto[];
  wordCount: number;
}

export interface NoteFilters {
  section?: NoteViewSection;
  categoryId?: string;
  tagId?: string;
  tagNames?: string[];
  search?: string;
  sortBy?: "updatedAt" | "createdAt" | "title" | "oldest";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DashboardNoteStats {
  totalActive: number;
  pinned: number;
  archived: number;
  trash: number;
  totalCategories: number;
  totalTags: number;
}
