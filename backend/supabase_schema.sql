-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Videos Table
create table videos (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  video_url text not null,
  original_language text default 'en',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scripts Table (Stores transcripts)
create table scripts (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  content text not null,
  is_cleaned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Translations Table
create table translations (
  id uuid default uuid_generate_v4() primary key,
  script_id uuid references scripts(id) on delete cascade not null,
  language text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
