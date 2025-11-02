-- Add photo_source column to leaderboard table
ALTER TABLE public.leaderboard 
ADD COLUMN photo_source text DEFAULT 'camera' CHECK (photo_source IN ('camera', 'upload'));