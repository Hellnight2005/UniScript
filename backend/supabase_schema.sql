-- UniScript Supabase Schema Reset
-- This script will DROP all existing tables and RECREATE them for the Job-Based Architecture.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

-- 1. Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS scripts;
DROP TABLE IF EXISTS videos;

-- 2. Create Videos table (The core job tracker)
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    video_url TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, EXTRACTING_AUDIO, AUDIO_EXTRACTED, TRANSCRIBING, FINALIZING, DONE, ERROR
    progress INTEGER DEFAULT 0,
    original_language TEXT DEFAULT 'en',
    target_language TEXT DEFAULT 'en',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Scripts table
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    content JSONB,
    is_cleaned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Translations table
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    target_language TEXT NOT NULL,
    translated_text TEXT,
    segments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Disable Row Level Security (RLS) for Hackathon Ease
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE translations DISABLE ROW LEVEL SECURITY;

-- Note: Make sure to create policies if you enable RLS, 
-- or disable RLS for testing if you are in a protected environment.
