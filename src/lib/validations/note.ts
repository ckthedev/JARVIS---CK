import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().trim().max(200, "Title cannot exceed 200 characters").optional().default("Untitled Note"),
  content: z.string().optional().default(""),
  plainText: z.string().optional().default(""),
  categoryId: z.string().uuid("Invalid category ID").nullable().optional(),
  tagNames: z.array(z.string().trim().min(1).max(30)).optional().default([]),
  isPinned: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().max(200, "Title cannot exceed 200 characters").optional(),
  content: z.string().optional(),
  plainText: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID").nullable().optional(),
  tagNames: z.array(z.string().trim().min(1).max(30)).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const createNoteCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(50, "Max 50 characters"),
  color: z.string().trim().max(30).optional().default("#00D4FF"),
});

export const updateNoteCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(50, "Max 50 characters").optional(),
  color: z.string().trim().max(30).optional(),
});

export const createNoteTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(30, "Max 30 characters"),
  color: z.string().trim().max(30).optional().default("#7A3FFF"),
});

export const updateNoteTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(30, "Max 30 characters").optional(),
  color: z.string().trim().max(30).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateNoteCategoryInput = z.infer<typeof createNoteCategorySchema>;
export type UpdateNoteCategoryInput = z.infer<typeof updateNoteCategorySchema>;
export type CreateNoteTagInput = z.infer<typeof createNoteTagSchema>;
export type UpdateNoteTagInput = z.infer<typeof updateNoteTagSchema>;
