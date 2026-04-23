/**
 * Storage factory.
 *
 * STORAGE_PROVIDER=supabase  → Supabase Storage (default for all envs with Supabase configured)
 * STORAGE_PROVIDER=local     → Local filesystem (dev only, single machine)
 *
 * Falls back to local if Supabase env vars are absent.
 */
import type { StorageProvider } from "./types";

export type { StorageProvider };

function getProvider(): StorageProvider {
  const explicit = process.env.STORAGE_PROVIDER;

  // If explicitly set to local, use it
  if (explicit === "local") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./localStorage").localStorage as StorageProvider;
  }

  // Use Supabase if vars are set (default)
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./supabaseStorage").supabaseStorage as StorageProvider;
  }

  // Fallback to local if Supabase not configured
  console.warn(
    "[storage] Supabase env vars not set — falling back to local storage. " +
      "This will NOT work across multiple users or devices."
  );
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./localStorage").localStorage as StorageProvider;
}

export const storageProvider: StorageProvider = getProvider();
