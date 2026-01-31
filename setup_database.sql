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
  content text not null,
  is_cleaned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Translations Table
create table if not exists translations (
  id uuid default uuid_generate_v4() primary key,
  script_id uuid references scripts(id) on delete cascade not null,
  language text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
