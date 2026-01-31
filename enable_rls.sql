-- Enable RLS on the table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to videos
CREATE POLICY "Public videos are viewable by everyone" ON videos
FOR SELECT USING (true);

-- Allow public insert access to videos (FOR TESTING ONLY)
CREATE POLICY "Anyone can insert videos" ON videos
FOR INSERT WITH CHECK (true);
