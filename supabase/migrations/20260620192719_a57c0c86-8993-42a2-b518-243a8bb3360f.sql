CREATE TABLE public.high_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  score numeric NOT NULL,
  state text,
  dosage text,
  snoop_quote text,
  eye_analysis text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.high_checks TO anon, authenticated;
GRANT ALL ON public.high_checks TO service_role;
ALTER TABLE public.high_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view high checks" ON public.high_checks FOR SELECT USING (true);
CREATE POLICY "Anyone can add high checks" ON public.high_checks FOR INSERT WITH CHECK (true);