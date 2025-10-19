-- Create leaderboard table for vibe scores
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  vibe_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard
  FOR SELECT
  USING (true);

-- Allow anyone to insert their score
CREATE POLICY "Anyone can add to leaderboard"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_leaderboard_score ON public.leaderboard(score DESC, created_at DESC);