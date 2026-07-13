-- Migration to add automated 24h AI follow-up reminders

-- 1. Ensure pg_cron and pg_net are enabled (should already be, but good practice)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Define the webhook URL and secret
-- The URL uses the Supabase Edge Function or internal URL. 
-- In development, Next.js runs on a different port, but in production, we typically use the public URL.
-- To ensure this is dynamic across environments, you can manually update the pg_cron job in Supabase dashboard 
-- with your production domain, but we'll use a placeholder/env standard here.

DO $$
BEGIN
  -- We'll schedule the cron job to run every 5 minutes.
  -- It sends a POST request to your Next.js application at /api/cron/24h-reminder.
  
  PERFORM cron.schedule(
    'ai-24h-reminder',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
      url:='https://your-production-domain.com/api/cron/24h-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET_HERE"}'::jsonb
    )
    $$
  );
END $$;
