-- Update comments table RLS policies to allow public commenting
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can add comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;

-- Create new policy allowing anyone to insert comments without authentication
CREATE POLICY "Anyone can insert comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (true);

-- Keep the existing view policy (anyone can view)
-- The "Anyone can view comments" policy should already exist