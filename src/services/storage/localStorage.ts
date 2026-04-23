import fs from "fs";
import path from "path";
import type { StorageProvider } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const localStorage: StorageProvider = {
  async upload(buffer, filename, _mimeType, suiteId) {
    const dir = path.join(UPLOAD_DIR, suiteId);
    fs.mkdirSync(dir, { recursive: true });

    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${suiteId}/${Date.now()}-${safe}`;
    const fullPath = path.join(UPLOAD_DIR, storagePath);

    fs.writeFileSync(fullPath, buffer);

    const url = `/uploads/${storagePath}`;
    return { url, storagePath, fileSizeBytes: buffer.length };
  },

  async delete(storagePath) {
    const fullPath = path.join(UPLOAD_DIR, storagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  },

  getPublicUrl(storagePath) {
    return `/uploads/${storagePath}`;
  },
};
