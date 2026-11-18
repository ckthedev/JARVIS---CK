import path from "path";
import { prisma } from "@/lib/prisma/client";
import { Prisma, StoredFile, Folder } from "@prisma/client";
import { storageProvider } from "@/lib/storage";
import {
  FileCategory,
  detectFileCategory,
  resolveMimeType,
  getFileExtension,
  isExecutableExtension,
  isPreviewable,
  getMaxUploadSizeBytes,
} from "@/lib/storage/file-types";
import {
  StoredFileDto,
  FolderDto,
  FolderBreadcrumb,
  FileFilters,
  StorageOverviewStats,
  NoteAttachmentDto,
} from "./types";
import {
  CreateFolderInput,
  UpdateFolderInput,
  DeleteFolderInput,
  RenameFileInput,
  MoveFileInput,
  MoveFolderInput,
  BulkFileActionInput,
} from "@/lib/validations/file";

export class FileService {
  // ===========================================================================
  // FOLDERS
  // ===========================================================================

  /**
   * Get folders within a specific parent directory for user.
   */
  async getFolders(userId: string, parentId: string | null = null): Promise<FolderDto[]> {
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        parentId: parentId || null,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    return folders.map((f) => ({
      id: f.id,
      userId: f.userId,
      parentId: f.parentId,
      name: f.name,
      color: f.color,
      deletedAt: f.deletedAt,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      fileCount: f._count.files,
      subfolderCount: f._count.children,
    }));
  }

  /**
   * Get all active folders for a user (used for tree navigation, move targets).
   */
  async getAllFolders(userId: string): Promise<FolderDto[]> {
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    return folders.map((f) => ({
      id: f.id,
      userId: f.userId,
      parentId: f.parentId,
      name: f.name,
      color: f.color,
      deletedAt: f.deletedAt,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      fileCount: f._count.files,
      subfolderCount: f._count.children,
    }));
  }

  /**
   * Get folder by ID with ownership check.
   */
  async getFolderById(userId: string, folderId: string): Promise<FolderDto | null> {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!folder) return null;

    return {
      id: folder.id,
      userId: folder.userId,
      parentId: folder.parentId,
      name: folder.name,
      color: folder.color,
      deletedAt: folder.deletedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      fileCount: folder._count.files,
      subfolderCount: folder._count.children,
    };
  }

  /**
   * Recursively get breadcrumbs from root to current folder.
   */
  async getFolderBreadcrumbs(userId: string, folderId: string | null): Promise<FolderBreadcrumb[]> {
    if (!folderId) return [];

    const breadcrumbs: FolderBreadcrumb[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder: { id: string; name: string; parentId: string | null } | null =
        await prisma.folder.findFirst({
          where: { id: currentId, userId },
          select: { id: true, name: true, parentId: true },
        });

      if (!folder) break;
      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return breadcrumbs;
  }

  /**
   * Create folder with duplicate name check in parent folder.
   */
  async createFolder(userId: string, input: CreateFolderInput): Promise<FolderDto> {
    const parentId = input.parentId || null;
    const name = input.name.trim();

    // Check duplicate name in same parent
    const existing = await prisma.folder.findFirst({
      where: {
        userId,
        parentId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new Error(`A folder named "${name}" already exists in this location`);
    }

    const folder = await prisma.folder.create({
      data: {
        userId,
        parentId,
        name,
        color: input.color || "#00D4FF",
      },
    });

    return {
      id: folder.id,
      userId: folder.userId,
      parentId: folder.parentId,
      name: folder.name,
      color: folder.color,
      deletedAt: folder.deletedAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      fileCount: 0,
      subfolderCount: 0,
    };
  }

  /**
   * Update folder (name, color, or move).
   */
  async updateFolder(
    userId: string,
    folderId: string,
    input: UpdateFolderInput
  ): Promise<FolderDto> {
    const existing = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!existing) {
      throw new Error("Folder not found or unauthorized");
    }

    const data: Prisma.FolderUpdateInput = {};

    if (input.name) {
      const name = input.name.trim();
      if (name.toLowerCase() !== existing.name.toLowerCase()) {
        const dup = await prisma.folder.findFirst({
          where: {
            userId,
            parentId: existing.parentId,
            name: { equals: name, mode: "insensitive" },
            id: { not: folderId },
            deletedAt: null,
          },
        });
        if (dup) {
          throw new Error(`A folder named "${name}" already exists in this location`);
        }
      }
      data.name = name;
    }

    if (input.color !== undefined) {
      data.color = input.color;
    }

    if (input.parentId !== undefined) {
      const newParentId = input.parentId || null;
      await this.validateFolderMovement(userId, folderId, newParentId);
      data.parent = newParentId ? { connect: { id: newParentId } } : { disconnect: true };
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data,
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      parentId: updated.parentId,
      name: updated.name,
      color: updated.color,
      deletedAt: updated.deletedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      fileCount: updated._count.files,
      subfolderCount: updated._count.children,
    };
  }

  /**
   * Prevent circular movement (cannot move folder inside itself or into its descendants).
   */
  private async validateFolderMovement(
    userId: string,
    folderId: string,
    targetParentId: string | null
  ): Promise<void> {
    if (!targetParentId) return; // Moving to root is always valid

    if (targetParentId === folderId) {
      throw new Error("Cannot move a folder inside itself");
    }

    // Traverse upwards from targetParentId to root to ensure folderId is not in ancestry
    let currentId: string | null = targetParentId;
    while (currentId) {
      if (currentId === folderId) {
        throw new Error("Cannot move a folder into one of its subfolders");
      }
      const parent: { parentId: string | null } | null = await prisma.folder.findFirst({
        where: { id: currentId, userId },
        select: { parentId: true },
      });
      currentId = parent?.parentId || null;
    }
  }

  /**
   * Move folder to new parent with circular dependency checks.
   */
  async moveFolder(userId: string, folderId: string, input: MoveFolderInput): Promise<FolderDto> {
    return this.updateFolder(userId, folderId, { parentId: input.parentId });
  }

  /**
   * Delete folder with explicit content policy ("move_to_parent" or "trash_all").
   */
  async deleteFolder(
    userId: string,
    folderId: string,
    input: DeleteFolderInput
  ): Promise<boolean> {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new Error("Folder not found or unauthorized");
    }

    if (input.action === "move_to_parent") {
      // Move all files to parent folder
      await prisma.storedFile.updateMany({
        where: { folderId },
        data: { folderId: folder.parentId },
      });

      // Move all child folders to parent folder
      await prisma.folder.updateMany({
        where: { parentId: folderId },
        data: { parentId: folder.parentId },
      });

      // Permanently remove the empty folder record
      await prisma.folder.delete({ where: { id: folderId } });
    } else {
      // "trash_all": Soft-delete folder and all nested files
      const now = new Date();
      await prisma.folder.update({
        where: { id: folderId },
        data: { deletedAt: now },
      });

      await prisma.storedFile.updateMany({
        where: { folderId },
        data: { deletedAt: now },
      });
    }

    return true;
  }

  // ===========================================================================
  // FILES CRUD, UPLOAD & SEARCH
  // ===========================================================================

  /**
   * Get files based on section, folder, category, search, and sorting.
   */
  async getFiles(userId: string, filters: FileFilters = {}): Promise<StoredFileDto[]> {
    const {
      section = "all",
      folderId,
      search,
      category,
      sortBy = "createdAt",
      sortOrder = "desc",
      page,
      limit,
    } = filters;

    const where: Prisma.StoredFileWhereInput = {
      userId,
    };

    // Section filtering
    switch (section) {
      case "all":
        where.deletedAt = null;
        if (folderId !== undefined) {
          where.folderId = folderId;
        }
        break;
      case "recent":
        where.deletedAt = null;
        break;
      case "images":
        where.deletedAt = null;
        where.category = "IMAGE";
        break;
      case "videos":
        where.deletedAt = null;
        where.category = "VIDEO";
        break;
      case "audio":
        where.deletedAt = null;
        where.category = "AUDIO";
        break;
      case "documents":
        where.deletedAt = null;
        where.category = "DOCUMENT";
        break;
      case "spreadsheets":
        where.deletedAt = null;
        where.category = "SPREADSHEET";
        break;
      case "presentations":
        where.deletedAt = null;
        where.category = "PRESENTATION";
        break;
      case "archives":
        where.deletedAt = null;
        where.category = "ARCHIVE";
        break;
      case "code":
        where.deletedAt = null;
        where.category = "CODE";
        break;
      case "other":
        where.deletedAt = null;
        where.category = "OTHER";
        break;
      case "folder":
        where.deletedAt = null;
        where.folderId = folderId || null;
        break;
      case "trash":
        where.deletedAt = { not: null };
        break;
    }

    // Direct category filter override
    if (category) {
      where.category = category;
    }

    // Search by filename or extension
    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { originalName: { contains: q, mode: "insensitive" } },
        { extension: { contains: q.replace(/^\./, ""), mode: "insensitive" } },
      ];
    }

    // Sorting
    const orderBy: Prisma.StoredFileOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "name":
        orderBy.push({ originalName: sortOrder });
        break;
      case "sizeBytes":
        orderBy.push({ sizeBytes: sortOrder });
        break;
      case "createdAt":
      default:
        orderBy.push({ createdAt: sortOrder });
        break;
    }

    const take = limit && limit > 0 ? limit : section === "recent" ? 20 : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const files = await prisma.storedFile.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        folder: true,
      },
    });

    return files.map((f) => this.mapToFileDto(f));
  }

  /**
   * Get file details with ownership check.
   */
  async getFileById(userId: string, fileId: string): Promise<StoredFileDto | null> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
      include: {
        folder: true,
      },
    });

    if (!file) return null;
    return this.mapToFileDto(file);
  }

  /**
   * Upload file into PostgreSQL and storage disk with size checks and deduplication.
   */
  async uploadFile(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    folderId: string | null = null,
    browserMimeType?: string
  ): Promise<StoredFileDto> {
    const maxBytes = getMaxUploadSizeBytes();
    if (fileBuffer.length > maxBytes) {
      throw new Error(
        `File size (${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds configured maximum upload limit (${(maxBytes / (1024 * 1024)).toFixed(0)}MB)`
      );
    }

    // Validate folder ownership if folderId provided
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId, deletedAt: null },
      });
      if (!folder) {
        throw new Error("Specified folder does not exist or unauthorized");
      }
    }

    // Extension & Category
    const extension = getFileExtension(originalName);
    const mimeType = resolveMimeType(originalName, browserMimeType);
    const category = detectFileCategory(originalName, mimeType);

    // Compute unique display filename if duplicate exists in same folder
    const uniqueDisplayName = await this.resolveUniqueFilename(
      userId,
      folderId,
      originalName
    );

    // Upload to local storage
    const uploadResult = await storageProvider.uploadFile(
      fileBuffer,
      originalName,
      userId
    );

    // Create database record
    const storedFile = await prisma.storedFile.create({
      data: {
        userId,
        folderId,
        originalName: uniqueDisplayName,
        storageName: uploadResult.storageName,
        storagePath: uploadResult.storagePath,
        mimeType,
        sizeBytes: BigInt(uploadResult.sizeBytes),
        extension,
        category,
        checksum: uploadResult.checksum,
        metadata: {
          isExecutable: isExecutableExtension(originalName),
        },
      },
      include: {
        folder: true,
      },
    });

    return this.mapToFileDto(storedFile);
  }

  /**
   * Generate clean "filename (1).ext" when duplicate exists in target directory.
   */
  private async resolveUniqueFilename(
    userId: string,
    folderId: string | null,
    filename: string
  ): Promise<string> {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);

    const existingFiles = await prisma.storedFile.findMany({
      where: {
        userId,
        folderId,
        deletedAt: null,
        originalName: { startsWith: base },
      },
      select: { originalName: true },
    });

    const existingNames = new Set(existingFiles.map((f) => f.originalName.toLowerCase()));

    if (!existingNames.has(filename.toLowerCase())) {
      return filename;
    }

    let counter = 1;
    let candidate = `${base} (${counter})${ext}`;
    while (existingNames.has(candidate.toLowerCase())) {
      counter++;
      candidate = `${base} (${counter})${ext}`;
    }

    return candidate;
  }

  /**
   * Download original file buffer with access tracking.
   */
  async downloadFile(
    userId: string,
    fileId: string
  ): Promise<{
    buffer: Buffer;
    file: StoredFileDto;
    mimeType: string;
    filename: string;
  }> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
      include: { folder: true },
    });

    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    // Update lastAccessedAt timestamp
    const updated = await prisma.storedFile.update({
      where: { id: fileId },
      data: { lastAccessedAt: new Date() },
      include: { folder: true },
    });

    const buffer = await storageProvider.getFile(file.storagePath);

    return {
      buffer,
      file: this.mapToFileDto(updated),
      mimeType: file.mimeType,
      filename: file.originalName,
    };
  }

  /**
   * Rename file.
   */
  async renameFile(userId: string, fileId: string, input: RenameFileInput): Promise<StoredFileDto> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    const newName = input.name.trim();
    const newExt = getFileExtension(newName);
    const newMime = resolveMimeType(newName);
    const newCat = detectFileCategory(newName, newMime);

    const updated = await prisma.storedFile.update({
      where: { id: fileId },
      data: {
        originalName: newName,
        extension: newExt,
        mimeType: newMime,
        category: newCat,
      },
      include: {
        folder: true,
      },
    });

    return this.mapToFileDto(updated);
  }

  /**
   * Move file to a different folder.
   */
  async moveFile(userId: string, fileId: string, input: MoveFileInput): Promise<StoredFileDto> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    const targetFolderId = input.folderId || null;
    if (targetFolderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: targetFolderId, userId, deletedAt: null },
      });
      if (!folder) {
        throw new Error("Target folder not found");
      }
    }

    const updated = await prisma.storedFile.update({
      where: { id: fileId },
      data: { folderId: targetFolderId },
      include: { folder: true },
    });

    return this.mapToFileDto(updated);
  }

  /**
   * Copy file (duplicates record and physical file).
   */
  async copyFile(userId: string, fileId: string, targetFolderId?: string | null): Promise<StoredFileDto> {
    const original = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!original) {
      throw new Error("File not found or unauthorized");
    }

    const destinationFolderId = targetFolderId !== undefined ? targetFolderId : original.folderId;
    const copyDisplayName = `Copy of ${original.originalName}`;
    const uniqueName = await this.resolveUniqueFilename(userId, destinationFolderId, copyDisplayName);

    const uploadResult = await storageProvider.copyFile(
      original.storagePath,
      uniqueName,
      userId
    );

    const copied = await prisma.storedFile.create({
      data: {
        userId,
        folderId: destinationFolderId,
        originalName: uniqueName,
        storageName: uploadResult.storageName,
        storagePath: uploadResult.storagePath,
        mimeType: original.mimeType,
        sizeBytes: BigInt(uploadResult.sizeBytes),
        extension: original.extension,
        category: original.category,
        checksum: uploadResult.checksum,
        metadata: original.metadata as Prisma.InputJsonValue,
      },
      include: {
        folder: true,
      },
    });

    return this.mapToFileDto(copied);
  }

  /**
   * Soft-delete file (moves to trash).
   */
  async softDeleteFile(userId: string, fileId: string): Promise<boolean> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    await prisma.storedFile.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  /**
   * Restore file from trash.
   */
  async restoreFile(userId: string, fileId: string): Promise<StoredFileDto> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    const restored = await prisma.storedFile.update({
      where: { id: fileId },
      data: { deletedAt: null },
      include: { folder: true },
    });

    return this.mapToFileDto(restored);
  }

  /**
   * Permanently delete file from database and disk.
   */
  async permanentlyDeleteFile(userId: string, fileId: string): Promise<boolean> {
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    // Remove from physical disk
    await storageProvider.deleteFile(file.storagePath);

    // Remove from database
    await prisma.storedFile.delete({
      where: { id: fileId },
    });

    return true;
  }

  /**
   * Empty trash: permanently delete all soft-deleted files and folders.
   */
  async emptyTrash(userId: string): Promise<{ filesCount: number; foldersCount: number }> {
    const filesToDelete = await prisma.storedFile.findMany({
      where: { userId, deletedAt: { not: null } },
    });

    for (const f of filesToDelete) {
      try {
        await storageProvider.deleteFile(f.storagePath);
      } catch (err) {
        console.error(`Failed to unlink file ${f.storagePath}:`, err);
      }
    }

    const fileDeleteResult = await prisma.storedFile.deleteMany({
      where: { userId, deletedAt: { not: null } },
    });

    const folderDeleteResult = await prisma.folder.deleteMany({
      where: { userId, deletedAt: { not: null } },
    });

    return {
      filesCount: fileDeleteResult.count,
      foldersCount: folderDeleteResult.count,
    };
  }

  /**
   * Bulk file operations (delete, restore, permanent delete, move).
   */
  async bulkAction(userId: string, input: BulkFileActionInput): Promise<{ count: number }> {
    const { fileIds, action, targetFolderId } = input;

    switch (action) {
      case "delete": {
        const res = await prisma.storedFile.updateMany({
          where: { id: { in: fileIds }, userId },
          data: { deletedAt: new Date() },
        });
        return { count: res.count };
      }
      case "restore": {
        const res = await prisma.storedFile.updateMany({
          where: { id: { in: fileIds }, userId },
          data: { deletedAt: null },
        });
        return { count: res.count };
      }
      case "move": {
        const folderId = targetFolderId || null;
        if (folderId) {
          const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId, deletedAt: null },
          });
          if (!folder) throw new Error("Target folder not found");
        }
        const res = await prisma.storedFile.updateMany({
          where: { id: { in: fileIds }, userId },
          data: { folderId },
        });
        return { count: res.count };
      }
      case "permanent_delete": {
        let deletedCount = 0;
        for (const id of fileIds) {
          const file = await prisma.storedFile.findFirst({
            where: { id, userId },
          });
          if (file) {
            await storageProvider.deleteFile(file.storagePath);
            await prisma.storedFile.delete({ where: { id } });
            deletedCount++;
          }
        }
        return { count: deletedCount };
      }
    }
  }

  // ===========================================================================
  // STORAGE OVERVIEW & RECONCILIATION
  // ===========================================================================

  /**
   * Compute comprehensive storage usage stats and health.
   */
  async getStorageOverview(userId: string): Promise<StorageOverviewStats> {
    const [
      totalFiles,
      totalFolders,
      allFiles,
      trashFiles,
      storageHealth,
    ] = await Promise.all([
      prisma.storedFile.count({ where: { userId, deletedAt: null } }),
      prisma.folder.count({ where: { userId, deletedAt: null } }),
      prisma.storedFile.findMany({
        where: { userId, deletedAt: null },
        select: { sizeBytes: true, category: true },
      }),
      prisma.storedFile.findMany({
        where: { userId, deletedAt: { not: null } },
        select: { sizeBytes: true },
      }),
      storageProvider.getStorageHealth(),
    ]);

    let totalBytes = 0;
    let imagesBytes = 0;
    let videosBytes = 0;
    let audioBytes = 0;
    let documentsBytes = 0;
    let spreadsheetsBytes = 0;
    let presentationsBytes = 0;
    let archivesBytes = 0;
    let codeBytes = 0;
    let otherBytes = 0;

    for (const f of allFiles) {
      const bytes = Number(f.sizeBytes);
      totalBytes += bytes;
      switch (f.category) {
        case "IMAGE":
          imagesBytes += bytes;
          break;
        case "VIDEO":
          videosBytes += bytes;
          break;
        case "AUDIO":
          audioBytes += bytes;
          break;
        case "DOCUMENT":
          documentsBytes += bytes;
          break;
        case "SPREADSHEET":
          spreadsheetsBytes += bytes;
          break;
        case "PRESENTATION":
          presentationsBytes += bytes;
          break;
        case "ARCHIVE":
          archivesBytes += bytes;
          break;
        case "CODE":
          codeBytes += bytes;
          break;
        default:
          otherBytes += bytes;
          break;
      }
    }

    let trashBytes = 0;
    for (const tf of trashFiles) {
      trashBytes += Number(tf.sizeBytes);
    }

    return {
      totalFiles,
      totalBytes,
      totalFolders,
      imagesBytes,
      videosBytes,
      audioBytes,
      documentsBytes,
      spreadsheetsBytes,
      presentationsBytes,
      archivesBytes,
      codeBytes,
      otherBytes,
      trashCount: trashFiles.length,
      trashBytes,
      isHealthy: storageHealth.isHealthy,
    };
  }

  // ===========================================================================
  // NOTE ATTACHMENTS (PHASE 3 INTEGRATION)
  // ===========================================================================

  /**
   * Attach an existing file to a note.
   */
  async attachFileToNote(userId: string, noteId: string, fileId: string): Promise<NoteAttachmentDto> {
    // Validate note ownership
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });
    if (!note) {
      throw new Error("Note not found or unauthorized");
    }

    // Validate file ownership
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId },
      include: { folder: true },
    });
    if (!file) {
      throw new Error("File not found or unauthorized");
    }

    // Check if already attached
    const existing = await prisma.noteAttachment.findUnique({
      where: {
        noteId_fileId: { noteId, fileId },
      },
      include: {
        file: { include: { folder: true } },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        noteId: existing.noteId,
        fileId: existing.fileId,
        createdAt: existing.createdAt,
        file: this.mapToFileDto(existing.file),
      };
    }

    const attachment = await prisma.noteAttachment.create({
      data: {
        noteId,
        fileId,
      },
      include: {
        file: { include: { folder: true } },
      },
    });

    return {
      id: attachment.id,
      noteId: attachment.noteId,
      fileId: attachment.fileId,
      createdAt: attachment.createdAt,
      file: this.mapToFileDto(attachment.file),
    };
  }

  /**
   * Detach file from note without deleting original file.
   */
  async detachFileFromNote(userId: string, noteId: string, fileId: string): Promise<boolean> {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });
    if (!note) {
      throw new Error("Note not found or unauthorized");
    }

    await prisma.noteAttachment.deleteMany({
      where: { noteId, fileId },
    });

    return true;
  }

  /**
   * Get all attachments for a specific note.
   */
  async getNoteAttachments(userId: string, noteId: string): Promise<NoteAttachmentDto[]> {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });
    if (!note) return [];

    const attachments = await prisma.noteAttachment.findMany({
      where: { noteId },
      orderBy: { createdAt: "desc" },
      include: {
        file: { include: { folder: true } },
      },
    });

    return attachments.map((a) => ({
      id: a.id,
      noteId: a.noteId,
      fileId: a.fileId,
      createdAt: a.createdAt,
      file: this.mapToFileDto(a.file),
    }));
  }

  // ===========================================================================
  // BACKWARD COMPATIBILITY
  // ===========================================================================

  async getRecentFiles(userId: string, limit = 5): Promise<StoredFileDto[]> {
    return this.getFiles(userId, {
      section: "recent",
      sortBy: "createdAt",
      sortOrder: "desc",
      limit,
    });
  }

  async getTotalStorageUsage(userId: string): Promise<{ totalFiles: number; totalBytes: number }> {
    const overview = await this.getStorageOverview(userId);
    return {
      totalFiles: overview.totalFiles,
      totalBytes: overview.totalBytes,
    };
  }

  // ===========================================================================
  // PRIVATE MAPPER
  // ===========================================================================

  private mapToFileDto(file: StoredFile & { folder?: Folder | null }): StoredFileDto {
    const category = (file.category as FileCategory) || "OTHER";
    return {
      id: file.id,
      userId: file.userId,
      folderId: file.folderId,
      originalName: file.originalName,
      storageName: file.storageName,
      mimeType: file.mimeType,
      sizeBytes: Number(file.sizeBytes),
      extension: file.extension,
      category,
      checksum: file.checksum,
      metadata: (file.metadata as Record<string, unknown> | null) || null,
      deletedAt: file.deletedAt,
      lastAccessedAt: file.lastAccessedAt,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      folder: file.folder
        ? {
          id: file.folder.id,
          userId: file.folder.userId,
          parentId: file.folder.parentId,
          name: file.folder.name,
          color: file.folder.color,
          deletedAt: file.folder.deletedAt,
          createdAt: file.folder.createdAt,
          updatedAt: file.folder.updatedAt,
        }
        : null,
      isPreviewable: isPreviewable(category, file.originalName),
    };
  }
}

export const fileService = new FileService();
