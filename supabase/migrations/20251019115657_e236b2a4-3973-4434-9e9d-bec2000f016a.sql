-- Change score column from integer to numeric to support decimal scores
ALTER TABLE public.leaderboard 
ALTER COLUMN score TYPE numeric USING score::numeric;