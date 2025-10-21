-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_entry_id UUID NOT NULL REFERENCES public.leaderboard(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  commenter_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view comments" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can add comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_comments_leaderboard_entry ON public.comments(leaderboard_entry_id);