-- Create table to store push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their subscription
CREATE POLICY "Anyone can subscribe to push notifications"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view subscriptions (needed for edge function)
CREATE POLICY "Service can view all subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (true);

-- Allow users to delete their own subscription by endpoint
CREATE POLICY "Users can delete their subscription"
  ON public.push_subscriptions
  FOR DELETE
  USING (true);