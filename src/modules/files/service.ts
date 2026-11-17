import { prisma } from "@/lib/prisma/client";
import { FileDto } from "./types";

export class FileService {
  async getRecentFiles(userId: string, limit = 5): Promise<FileDto[]> {
    const files = await prisma.storedFile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        folder: {
          select: { name: true },
        },
      },
    });

    return files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      storageName: f.storageName,
      mimeType: f.mimeType,
      sizeBytes: Number(f.sizeBytes),
      folderName: f.folder?.name ?? null,
      createdAt: f.createdAt,
    }));
  }

  async getTotalStorageUsage(userId: string): Promise<{ totalFiles: number; totalBytes: number }> {
    const [totalFiles, aggregation] = await Promise.all([
      prisma.storedFile.count({ where: { userId } }),
      prisma.storedFile.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
      }),
    ]);

    return {
      totalFiles,
      totalBytes: Number(aggregation._sum.sizeBytes ?? 0),
    };
  }
}

export const fileService = new FileService();
