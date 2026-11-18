import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { calculateChecksum } from "./file-types";

export interface StorageUploadResult {
  storageName: string;
  storagePath: string;
  sizeBytes: number;
  checksum: string;
}

export interface IStorageProvider {
  init(): Promise<void>;
  uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    subfolder?: string
  ): Promise<StorageUploadResult>;
  getFile(storagePath: string): Promise<Buffer>;
  deleteFile(storagePath: string): Promise<void>;
  fileExists(storagePath: string): Promise<boolean>;
  copyFile(
    sourceStoragePath: string,
    newOriginalName: string,
    subfolder?: string
  ): Promise<StorageUploadResult>;
  getStorageHealth(): Promise<{
    isHealthy: boolean;
    baseDirectory: string;
    totalStoredBytes: number;
    fileCount: number;
  }>;
}

export class LocalStorageProvider implements IStorageProvider {
  private readonly baseDirectory: string;
  private readonly rootDirectory: string;

  constructor(baseDirectory?: string) {
    const rawDir =
      baseDirectory || process.env.STORAGE_LOCAL_DIR || "./data/uploads";
    this.baseDirectory = path.resolve(process.cwd(), rawDir);
    this.rootDirectory = path.resolve(process.cwd(), "./data");
  }

  async init(): Promise<void> {
    await this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.baseDirectory, { recursive: true });
    await fs.mkdir(path.join(this.rootDirectory, "thumbnails"), { recursive: true });
    await fs.mkdir(path.join(this.rootDirectory, "temp"), { recursive: true });
    await fs.mkdir(path.join(this.rootDirectory, "backups"), { recursive: true });
  }

  private resolveSafePath(filePath: string): string {
    const resolved = path.resolve(this.baseDirectory, filePath);
    // Security check: Path Traversal Prevention
    if (!resolved.startsWith(this.baseDirectory)) {
      throw new Error("Access Denied: Path traversal attempt detected.");
    }
    return resolved;
  }

  private generateStorageFilename(originalName: string): string {
    const ext = path.extname(originalName).replace(/[^a-zA-Z0-9._-]/g, "");
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    subfolder = ""
  ): Promise<StorageUploadResult> {
    await this.ensureDirectories();

    const storageName = this.generateStorageFilename(originalName);
    const targetFolder = path.join(this.baseDirectory, subfolder);
    const safeTargetFolder = this.resolveSafePath(
      path.relative(this.baseDirectory, targetFolder)
    );

    await fs.mkdir(safeTargetFolder, { recursive: true });

    const fullFilePath = path.join(safeTargetFolder, storageName);
    await fs.writeFile(fullFilePath, fileBuffer);

    const relativeStoragePath = path
      .relative(this.baseDirectory, fullFilePath)
      .replace(/\\/g, "/");

    const checksum = calculateChecksum(fileBuffer);

    return {
      storageName,
      storagePath: relativeStoragePath,
      sizeBytes: fileBuffer.length,
      checksum,
    };
  }

  async getFile(storagePath: string): Promise<Buffer> {
    const safePath = this.resolveSafePath(storagePath);
    return await fs.readFile(safePath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const safePath = this.resolveSafePath(storagePath);
    try {
      await fs.unlink(safePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const safePath = this.resolveSafePath(storagePath);
      await fs.access(safePath);
      return true;
    } catch {
      return false;
    }
  }

  async copyFile(
    sourceStoragePath: string,
    newOriginalName: string,
    subfolder = ""
  ): Promise<StorageUploadResult> {
    const buffer = await this.getFile(sourceStoragePath);
    return this.uploadFile(buffer, newOriginalName, subfolder);
  }

  async getStorageHealth(): Promise<{
    isHealthy: boolean;
    baseDirectory: string;
    totalStoredBytes: number;
    fileCount: number;
  }> {
    try {
      await this.ensureDirectories();
      let totalBytes = 0;
      let count = 0;

      const scanDir = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile()) {
            const stat = await fs.stat(fullPath);
            totalBytes += stat.size;
            count++;
          }
        }
      };

      await scanDir(this.baseDirectory);

      return {
        isHealthy: true,
        baseDirectory: this.baseDirectory,
        totalStoredBytes: totalBytes,
        fileCount: count,
      };
    } catch (err) {
      console.error("Storage health check failed:", err);
      return {
        isHealthy: false,
        baseDirectory: this.baseDirectory,
        totalStoredBytes: 0,
        fileCount: 0,
      };
    }
  }
}

export const storageProvider: IStorageProvider = new LocalStorageProvider();
