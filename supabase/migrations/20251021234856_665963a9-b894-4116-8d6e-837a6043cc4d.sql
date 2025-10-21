-- Add user_id to comments table to link with authenticated users
ALTER TABLE public.comments
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to require authentication for inserting comments
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;

CREATE POLICY "Authenticated users can insert comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Keep the public select policy
-- Comments are still viewable by everyone