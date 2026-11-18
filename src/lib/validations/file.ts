import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Max 100 characters"),
  parentId: z.string().uuid("Invalid parent folder ID").nullable().optional(),
  color: z.string().trim().max(30).optional().default("#00D4FF"),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Max 100 characters").optional(),
  parentId: z.string().uuid("Invalid parent folder ID").nullable().optional(),
  color: z.string().trim().max(30).optional(),
});

export const deleteFolderSchema = z.object({
  action: z.enum(["move_to_parent", "trash_all"]).default("move_to_parent"),
});

export const renameFileSchema = z.object({
  name: z.string().trim().min(1, "Filename is required").max(255, "Max 255 characters"),
});

export const moveFileSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID").nullable().optional(),
});

export const moveFolderSchema = z.object({
  parentId: z.string().uuid("Invalid folder ID").nullable().optional(),
});

export const bulkFileActionSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1, "At least one file must be selected"),
  action: z.enum(["delete", "restore", "permanent_delete", "move"]),
  targetFolderId: z.string().uuid().nullable().optional(),
});

export const attachNoteFileSchema = z.object({
  noteId: z.string().uuid("Invalid note ID"),
  fileId: z.string().uuid("Invalid file ID"),
});

export type CreateFolderInput = z.input<typeof createFolderSchema>;
export type UpdateFolderInput = z.input<typeof updateFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type RenameFileInput = z.infer<typeof renameFileSchema>;
export type MoveFileInput = z.infer<typeof moveFileSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type BulkFileActionInput = z.infer<typeof bulkFileActionSchema>;
export type AttachNoteFileInput = z.infer<typeof attachNoteFileSchema>;
