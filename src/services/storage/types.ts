/**
 * Storage provider abstraction.
 * Implementations: Supabase Storage (default), Local FS (dev fallback).
 */
export interface StorageProvider {
  /**
   * Upload a file buffer and return the public URL and internal storage path.
   */
  upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    suiteId: string
  ): Promise<{ url: string; storagePath: string; fileSizeBytes: number }>;

  /**
   * Delete a file by its storage path (not URL).
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Get the public URL for a given storage path.
   */
  getPublicUrl(storagePath: string): string;
}
