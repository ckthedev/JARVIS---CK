import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageUploadResult {
  storageName: string;
  storagePath: string;
  sizeBytes: number;
}

export interface IStorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    subfolder?: string
  ): Promise<StorageUploadResult>;
  getFile(storagePath: string): Promise<Buffer>;
  deleteFile(storagePath: string): Promise<void>;
  fileExists(storagePath: string): Promise<boolean>;
}

export class LocalStorageProvider implements IStorageProvider {
  private readonly baseDirectory: string;

  constructor(baseDirectory?: string) {
    const rawDir =
      baseDirectory || process.env.STORAGE_LOCAL_DIR || "./data/uploads";
    this.baseDirectory = path.resolve(process.cwd(), rawDir);
  }

  private async ensureBaseDir(): Promise<void> {
    await fs.mkdir(this.baseDirectory, { recursive: true });
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
    await this.ensureBaseDir();

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

    return {
      storageName,
      storagePath: relativeStoragePath,
      sizeBytes: fileBuffer.length,
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
}

export const storageProvider: IStorageProvider = new LocalStorageProvider();
