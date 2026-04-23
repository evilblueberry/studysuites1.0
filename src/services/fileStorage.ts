/**
 * fileStorage.ts — Abstract file storage service
 *
 * MVP: stores files locally under /public/uploads/
 * Production: swap STORAGE_PROVIDER=s3 and implement the S3 branch.
 *
 * The interface stays the same regardless of provider.
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageUploadResult {
  storageUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

export interface FileStorageService {
  uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<StorageUploadResult>;
  deleteFile(storageUrl: string): Promise<void>;
  getAbsolutePath(storageUrl: string): string;
}

// ─── Local Storage (MVP) ──────────────────────────────────────────────────────

class LocalFileStorage implements FileStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    _mimeType: string
  ): Promise<StorageUploadResult> {
    await this.ensureDir();

    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const fileName = `${slugify(baseName)}-${uniqueId}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    return {
      storageUrl: `/uploads/${fileName}`,
      fileName: originalName,
      fileSizeBytes: buffer.length,
    };
  }

  async deleteFile(storageUrl: string): Promise<void> {
    const filePath = path.join(process.cwd(), "public", storageUrl);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist — ignore
    }
  }

  getAbsolutePath(storageUrl: string): string {
    return path.join(process.cwd(), "public", storageUrl);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createFileStorage(): FileStorageService {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      return new LocalFileStorage();
    // Future: case "s3": return new S3FileStorage();
    default:
      return new LocalFileStorage();
  }
}

export const fileStorage = createFileStorage();
