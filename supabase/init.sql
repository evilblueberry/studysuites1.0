-- Supabase initialization SQL for StudySuite
-- Run this in the Supabase Dashboard -> SQL Editor

-- 1. Enable pg_trgm for fast text search (used by Prisma if we add search queries later)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create the Storage Bucket for study materials
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials', 
  'study-materials', 
  true, -- Public read access (the app relies on obscured long paths for minimal security MVP)
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- 3. Set up Storage RLS Policies
-- Allow anyone to read files (URLs are unguessable)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'study-materials' );

-- Note: We do NOT need insert/update/delete policies because the app backend
-- uses the SUPABASE_SERVICE_ROLE_KEY to bypass RLS when uploading/deleting files.
-- This ensures users cannot arbitrarily upload files directly to the bucket.
