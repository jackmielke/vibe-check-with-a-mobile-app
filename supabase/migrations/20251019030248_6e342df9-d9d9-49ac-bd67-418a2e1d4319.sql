-- Create storage bucket for vibe photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vibe-photos', 'vibe-photos', true);

-- Create policy for anyone to upload photos
CREATE POLICY "Anyone can upload vibe photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vibe-photos');

-- Create policy for anyone to view photos
CREATE POLICY "Anyone can view vibe photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vibe-photos');

-- Add image_url column to leaderboard table
ALTER TABLE public.leaderboard
ADD COLUMN image_url TEXT;