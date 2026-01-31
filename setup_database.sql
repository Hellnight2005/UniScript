-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Tables
-- Videos Table
create table if not exists videos (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  video_url text not null,
  original_language text default 'en',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scripts Table
create table if not exists scripts (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  content jsonb not null, -- Optimized: using JSONB instead of TEXT
  is_cleaned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Translations Table
create table if not exists translations (
  id uuid default uuid_generate_v4() primary key,
  script_id uuid references scripts(id) on delete cascade not null,
  target_language text not null, -- Renamed from language
  translated_text text, -- Main text content
  segments jsonb, -- Timestamped segments
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists scripts_video_id_idx on scripts(video_id);
create index if not exists translations_script_id_idx on translations(script_id);

-- 2. Security (Row Level Security)
-- Enable RLS on tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- 3. Policies (Public Access for Verification/Testing)
-- Videos
DROP POLICY IF EXISTS "Public videos access" ON videos;
CREATE POLICY "Public videos access" ON videos FOR ALL USING (true) WITH CHECK (true);

-- Scripts
DROP POLICY IF EXISTS "Public scripts access" ON scripts;
CREATE POLICY "Public scripts access" ON scripts FOR ALL USING (true) WITH CHECK (true);

-- Translations
DROP POLICY IF EXISTS "Public translations access" ON translations;
CREATE POLICY "Public translations access" ON translations FOR ALL USING (true) WITH CHECK (true);
