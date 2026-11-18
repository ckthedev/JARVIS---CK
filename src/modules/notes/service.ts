import { prisma } from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import {
  NoteDto,
  NoteCategoryDto,
  NoteTagDto,
  NoteFilters,
  DashboardNoteStats,
} from "./types";
import {
  CreateNoteInput,
  UpdateNoteInput,
  CreateNoteCategoryInput,
  UpdateNoteCategoryInput,
  CreateNoteTagInput,
  UpdateNoteTagInput,
} from "@/lib/validations/note";
import {
  sanitizeNoteHtml,
  extractPlainText,
  computeWordCount,
} from "@/lib/utils/html-sanitizer";

export class NoteService {
  // ===========================================================================
  // CATEGORIES
  // ===========================================================================

  /**
   * Get all note categories for a user with active note count.
   */
  async getCategories(userId: string): Promise<NoteCategoryDto[]> {
    const categories = await prisma.noteCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            notes: {
              where: {
                deletedAt: null,
                isArchived: false,
              },
            },
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      color: c.color,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      noteCount: c._count.notes,
    }));
  }

  /**
   * Get category by ID with ownership check.
   */
  async getCategoryById(userId: string, categoryId: string): Promise<NoteCategoryDto | null> {
    const category = await prisma.noteCategory.findFirst({
      where: { id: categoryId, userId },
      include: {
        _count: {
          select: {
            notes: {
              where: {
                deletedAt: null,
                isArchived: false,
              },
            },
          },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      noteCount: category._count.notes,
    };
  }

  /**
   * Create category with duplicate name check for user.
   */
  async createCategory(userId: string, input: CreateNoteCategoryInput): Promise<NoteCategoryDto> {
    const existing = await prisma.noteCategory.findFirst({
      where: {
        userId,
        name: { equals: input.name.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      throw new Error(`Category with name "${input.name.trim()}" already exists`);
    }

    const category = await prisma.noteCategory.create({
      data: {
        userId,
        name: input.name.trim(),
        color: input.color || "#00D4FF",
      },
    });

    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      noteCount: 0,
    };
  }

  /**
   * Update category with duplicate name check.
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    input: UpdateNoteCategoryInput
  ): Promise<NoteCategoryDto> {
    const existing = await prisma.noteCategory.findFirst({
      where: { id: categoryId, userId },
    });

    if (!existing) {
      throw new Error("Category not found or unauthorized");
    }

    if (input.name && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.noteCategory.findFirst({
        where: {
          userId,
          name: { equals: input.name.trim(), mode: "insensitive" },
          id: { not: categoryId },
        },
      });

      if (duplicate) {
        throw new Error(`Category with name "${input.name.trim()}" already exists`);
      }
    }

    const updated = await prisma.noteCategory.update({
      where: { id: categoryId },
      data: {
        name: input.name?.trim(),
        color: input.color,
      },
      include: {
        _count: {
          select: {
            notes: {
              where: {
                deletedAt: null,
                isArchived: false,
              },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      color: updated.color,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      noteCount: updated._count.notes,
    };
  }

  /**
   * Delete category. Preserves notes (categoryId is set to null via ON DELETE SET NULL).
   */
  async deleteCategory(userId: string, categoryId: string): Promise<boolean> {
    const existing = await prisma.noteCategory.findFirst({
      where: { id: categoryId, userId },
    });

    if (!existing) {
      throw new Error("Category not found or unauthorized");
    }

    await prisma.noteCategory.delete({
      where: { id: categoryId },
    });

    return true;
  }

  /**
   * Seed default categories if user has none.
   */
  async seedDefaultCategories(userId: string): Promise<NoteCategoryDto[]> {
    const count = await prisma.noteCategory.count({ where: { userId } });
    if (count > 0) {
      return this.getCategories(userId);
    }

    const defaults = [
      { name: "Personal", color: "#00D4FF" },
      { name: "Work", color: "#7A3FFF" },
      { name: "Ideas", color: "#F59E0B" },
      { name: "Development", color: "#10B981" },
      { name: "Projects", color: "#EC4899" },
      { name: "Meetings", color: "#6366F1" },
    ];

    for (const d of defaults) {
      await prisma.noteCategory.create({
        data: {
          userId,
          name: d.name,
          color: d.color,
        },
      });
    }

    return this.getCategories(userId);
  }

  // ===========================================================================
  // TAGS
  // ===========================================================================

  /**
   * Get all tags for a user with active note count.
   */
  async getTags(userId: string): Promise<NoteTagDto[]> {
    const tags = await prisma.noteTag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            notes: {
              where: {
                note: {
                  deletedAt: null,
                  isArchived: false,
                },
              },
            },
          },
        },
      },
    });

    return tags.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.name,
      color: t.color,
      createdAt: t.createdAt,
      noteCount: t._count.notes,
    }));
  }

  /**
   * Create tag with duplicate name check.
   */
  async createTag(userId: string, input: CreateNoteTagInput): Promise<NoteTagDto> {
    const existing = await prisma.noteTag.findFirst({
      where: {
        userId,
        name: { equals: input.name.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      throw new Error(`Tag "${input.name.trim()}" already exists`);
    }

    const tag = await prisma.noteTag.create({
      data: {
        userId,
        name: input.name.trim(),
        color: input.color || "#7A3FFF",
      },
    });

    return {
      id: tag.id,
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
      noteCount: 0,
    };
  }

  /**
   * Update tag name or color.
   */
  async updateTag(userId: string, tagId: string, input: UpdateNoteTagInput): Promise<NoteTagDto> {
    const existing = await prisma.noteTag.findFirst({
      where: { id: tagId, userId },
    });

    if (!existing) {
      throw new Error("Tag not found or unauthorized");
    }

    if (input.name && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.noteTag.findFirst({
        where: {
          userId,
          name: { equals: input.name.trim(), mode: "insensitive" },
          id: { not: tagId },
        },
      });

      if (duplicate) {
        throw new Error(`Tag "${input.name.trim()}" already exists`);
      }
    }

    const updated = await prisma.noteTag.update({
      where: { id: tagId },
      data: {
        name: input.name?.trim(),
        color: input.color,
      },
      include: {
        _count: {
          select: {
            notes: {
              where: {
                note: {
                  deletedAt: null,
                  isArchived: false,
                },
              },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      color: updated.color,
      createdAt: updated.createdAt,
      noteCount: updated._count.notes,
    };
  }

  /**
   * Delete tag.
   */
  async deleteTag(userId: string, tagId: string): Promise<boolean> {
    const existing = await prisma.noteTag.findFirst({
      where: { id: tagId, userId },
    });

    if (!existing) {
      throw new Error("Tag not found or unauthorized");
    }

    await prisma.noteTag.delete({
      where: { id: tagId },
    });

    return true;
  }

  // ===========================================================================
  // NOTES CRUD & FILTERING
  // ===========================================================================

  /**
   * Get notes with section filtering, search, and sorting.
   */
  async getNotes(userId: string, filters: NoteFilters = {}): Promise<NoteDto[]> {
    const {
      section = "all",
      categoryId,
      tagId,
      tagNames,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
      page,
      limit,
    } = filters;

    const where: Prisma.NoteWhereInput = {
      userId,
    };

    // Section filtering
    switch (section) {
      case "all":
        where.deletedAt = null;
        where.isArchived = false;
        break;
      case "pinned":
        where.deletedAt = null;
        where.isArchived = false;
        where.isPinned = true;
        break;
      case "archived":
        where.deletedAt = null;
        where.isArchived = true;
        break;
      case "trash":
        where.deletedAt = { not: null };
        break;
      case "category":
        where.deletedAt = null;
        where.isArchived = false;
        if (categoryId) {
          where.categoryId = categoryId;
        }
        break;
      case "tag":
        where.deletedAt = null;
        where.isArchived = false;
        if (tagId) {
          where.tags = { some: { tagId } };
        }
        break;
    }

    // Direct category filter override
    if (categoryId && section !== "category") {
      where.categoryId = categoryId;
    }

    // Tag filtering by name or ID
    if (tagNames && tagNames.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tagNames, mode: "insensitive" },
          },
        },
      };
    }

    // Search: searches title, plainText, category name, or tag names
    if (search && search.trim() !== "") {
      const query = search.trim();
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { plainText: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
        { tags: { some: { tag: { name: { contains: query, mode: "insensitive" } } } } },
      ];
    }

    // Sorting
    let orderBy: Prisma.NoteOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "updatedAt":
        orderBy = section === "trash" ? [{ updatedAt: "desc" }] : [{ isPinned: "desc" }, { updatedAt: sortOrder }];
        break;
      case "createdAt":
        orderBy = section === "trash" ? [{ createdAt: "desc" }] : [{ isPinned: "desc" }, { createdAt: sortOrder }];
        break;
      case "title":
        orderBy = [{ title: sortOrder }];
        break;
      case "oldest":
        orderBy = [{ createdAt: "asc" }];
        break;
      default:
        orderBy = [{ isPinned: "desc" }, { updatedAt: "desc" }];
    }

    const take = limit && limit > 0 ? limit : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const notes = await prisma.note.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return notes.map((n) => this.mapToDto(n));
  }

  /**
   * Get single note with full details.
   */
  async getNoteById(userId: string, noteId: string): Promise<NoteDto | null> {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!note) return null;
    return this.mapToDto(note);
  }

  /**
   * Create a new note with HTML sanitization, tag linking, and plainText extraction.
   */
  async createNote(userId: string, input: CreateNoteInput): Promise<NoteDto> {
    const title = input.title?.trim() || "Untitled Note";
    const rawContent = input.content || "";
    const sanitizedContent = sanitizeNoteHtml(rawContent);
    const plainText = input.plainText?.trim() || extractPlainText(sanitizedContent);

    // Validate category ownership if categoryId provided
    if (input.categoryId) {
      const category = await prisma.noteCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new Error("Invalid category specified");
      }
    }

    // Create note in transaction with tag associations
    const note = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.note.create({
        data: {
          userId,
          title,
          content: sanitizedContent,
          plainText,
          categoryId: input.categoryId || null,
          isPinned: input.isPinned ?? false,
          isArchived: input.isArchived ?? false,
        },
      });

      // Handle tags
      if (input.tagNames && input.tagNames.length > 0) {
        for (const rawTagName of input.tagNames) {
          const tagName = rawTagName.trim();
          if (!tagName) continue;

          // Upsert tag for user
          let tag = await tx.noteTag.findFirst({
            where: {
              userId,
              name: { equals: tagName, mode: "insensitive" },
            },
          });

          if (!tag) {
            tag = await tx.noteTag.create({
              data: {
                userId,
                name: tagName,
                color: "#7A3FFF",
              },
            });
          }

          // Link tag to note
          await tx.noteTagOnNote.create({
            data: {
              noteId: createdNote.id,
              tagId: tag.id,
            },
          });
        }
      }

      return tx.note.findUniqueOrThrow({
        where: { id: createdNote.id },
        include: {
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return this.mapToDto(note);
  }

  /**
   * Update an existing note with optimistic conflict prevention and sanitization.
   */
  async updateNote(userId: string, noteId: string, input: UpdateNoteInput): Promise<NoteDto> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error("Note not found or unauthorized");
    }

    // Validate category if specified
    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await prisma.noteCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new Error("Invalid category specified");
      }
    }

    const data: Prisma.NoteUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title.trim() || "Untitled Note";
    }

    if (input.content !== undefined) {
      data.content = sanitizeNoteHtml(input.content);
      data.plainText = input.plainText !== undefined ? input.plainText : extractPlainText(data.content as string);
    } else if (input.plainText !== undefined) {
      data.plainText = input.plainText;
    }

    if (input.categoryId !== undefined) {
      data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
    }

    if (input.isPinned !== undefined) {
      data.isPinned = input.isPinned;
    }

    if (input.isArchived !== undefined) {
      data.isArchived = input.isArchived;
    }

    const updatedNote = await prisma.$transaction(async (tx) => {
      // Update note fields
      await tx.note.update({
        where: { id: noteId },
        data,
      });

      // Sync tags if tagNames supplied
      if (input.tagNames !== undefined) {
        // Remove existing associations
        await tx.noteTagOnNote.deleteMany({
          where: { noteId },
        });

        // Add new associations
        for (const rawTagName of input.tagNames) {
          const tagName = rawTagName.trim();
          if (!tagName) continue;

          let tag = await tx.noteTag.findFirst({
            where: {
              userId,
              name: { equals: tagName, mode: "insensitive" },
            },
          });

          if (!tag) {
            tag = await tx.noteTag.create({
              data: {
                userId,
                name: tagName,
                color: "#7A3FFF",
              },
            });
          }

          await tx.noteTagOnNote.create({
            data: {
              noteId,
              tagId: tag.id,
            },
          });
        }
      }

      return tx.note.findUniqueOrThrow({
        where: { id: noteId },
        include: {
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return this.mapToDto(updatedNote);
  }

  /**
   * Soft-delete note (moves to trash).
   */
  async softDeleteNote(userId: string, noteId: string): Promise<boolean> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error("Note not found or unauthorized");
    }

    await prisma.note.update({
      where: { id: noteId },
      data: {
        deletedAt: new Date(),
        isPinned: false, // Unpin when sent to trash
      },
    });

    return true;
  }

  /**
   * Restore soft-deleted note from trash.
   */
  async restoreNote(userId: string, noteId: string): Promise<NoteDto> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error("Note not found or unauthorized");
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        deletedAt: null,
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToDto(note);
  }

  /**
   * Permanently delete a note from PostgreSQL.
   */
  async permanentlyDeleteNote(userId: string, noteId: string): Promise<boolean> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error("Note not found or unauthorized");
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return true;
  }

  /**
   * Empty trash: permanently delete all soft-deleted notes for a user.
   */
  async emptyTrash(userId: string): Promise<number> {
    const result = await prisma.note.deleteMany({
      where: {
        userId,
        deletedAt: { not: null },
      },
    });

    return result.count;
  }

  /**
   * Duplicate note. Creates a copy with title "Copy of ...", preserving category and tags.
   */
  async duplicateNote(userId: string, noteId: string): Promise<NoteDto> {
    const original = await this.getNoteById(userId, noteId);
    if (!original) {
      throw new Error("Note not found or unauthorized");
    }

    const copyTitle = original.title.startsWith("Copy of ") ? original.title : `Copy of ${original.title}`;

    return this.createNote(userId, {
      title: copyTitle,
      content: original.content,
      plainText: original.plainText,
      categoryId: original.categoryId,
      tagNames: original.tags.map((t) => t.name),
      isPinned: false,
      isArchived: false,
    });
  }

  /**
   * Toggle pinned status.
   */
  async togglePin(userId: string, noteId: string): Promise<NoteDto> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error("Note not found or unauthorized");
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { isPinned: !existing.isPinned },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Toggle archived status.
   */
  async toggleArchive(userId: string, noteId: string): Promise<NoteDto> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      throw new Error("Note not found or unauthorized");
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        isArchived: !existing.isArchived,
        isPinned: !existing.isArchived ? false : existing.isPinned, // unpin when archiving
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Get dashboard metrics for notes.
   */
  async getDashboardNoteStats(userId: string): Promise<DashboardNoteStats> {
    const [totalActive, pinned, archived, trash, totalCategories, totalTags] = await Promise.all([
      prisma.note.count({
        where: { userId, deletedAt: null, isArchived: false },
      }),
      prisma.note.count({
        where: { userId, deletedAt: null, isArchived: false, isPinned: true },
      }),
      prisma.note.count({
        where: { userId, deletedAt: null, isArchived: true },
      }),
      prisma.note.count({
        where: { userId, deletedAt: { not: null } },
      }),
      prisma.noteCategory.count({
        where: { userId },
      }),
      prisma.noteTag.count({
        where: { userId },
      }),
    ]);

    return {
      totalActive,
      pinned,
      archived,
      trash,
      totalCategories,
      totalTags,
    };
  }

  /**
   * Backward-compatible method used by dashboard and legacy callers.
   */
  async getRecentNotes(userId: string, limit = 5): Promise<NoteDto[]> {
    return this.getNotes(userId, {
      section: "all",
      sortBy: "updatedAt",
      sortOrder: "desc",
      limit,
    });
  }

  /**
   * Backward-compatible total active notes count.
   */
  async getTotalCount(userId: string): Promise<number> {
    return prisma.note.count({
      where: {
        userId,
        deletedAt: null,
        isArchived: false,
      },
    });
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private mapToDto(
    note: Prisma.NoteGetPayload<{
      include: {
        category: true;
        tags: {
          include: {
            tag: true;
          };
        };
      };
    }>
  ): NoteDto {
    const plainText = note.plainText || extractPlainText(note.content);
    return {
      id: note.id,
      userId: note.userId,
      categoryId: note.categoryId,
      title: note.title,
      content: note.content,
      plainText,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      deletedAt: note.deletedAt,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      category: note.category
        ? {
            id: note.category.id,
            userId: note.category.userId,
            name: note.category.name,
            color: note.category.color,
            createdAt: note.category.createdAt,
            updatedAt: note.category.updatedAt,
          }
        : null,
      tags: (note.tags || []).map((t) => ({
        id: t.tag.id,
        userId: t.tag.userId,
        name: t.tag.name,
        color: t.tag.color,
        createdAt: t.tag.createdAt,
      })),
      wordCount: computeWordCount(plainText),
    };
  }
}

export const noteService = new NoteService();
