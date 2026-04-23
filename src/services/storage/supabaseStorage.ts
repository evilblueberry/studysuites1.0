import { createClient } from "@supabase/supabase-js";
import type { StorageProvider } from "./types";

const BUCKET = "study-materials";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export const supabaseStorage: StorageProvider = {
  async upload(buffer, filename, mimeType, suiteId) {
    const client = getAdminClient();
    // Sanitize filename: strip special chars, collapse spaces
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${suiteId}/${Date.now()}-${safe}`;

    const { error } = await client.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    return { url, storagePath, fileSizeBytes: buffer.length };
  },

  async delete(storagePath) {
    const client = getAdminClient();
    const { error } = await client.storage.from(BUCKET).remove([storagePath]);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  },

  getPublicUrl(storagePath) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  },
};
