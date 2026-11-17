import { prisma } from "@/lib/prisma/client";
import { NoteDto } from "./types";

export class NoteService {
  async getRecentNotes(userId: string, limit = 5): Promise<NoteDto[]> {
    const notes = await prisma.note.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: limit,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      isPinned: n.isPinned,
      updatedAt: n.updatedAt,
      tags: n.tags.map((t) => t.tag.name),
    }));
  }

  async getTotalCount(userId: string): Promise<number> {
    return await prisma.note.count({
      where: {
        userId,
        isArchived: false,
      },
    });
  }
}

export const noteService = new NoteService();
