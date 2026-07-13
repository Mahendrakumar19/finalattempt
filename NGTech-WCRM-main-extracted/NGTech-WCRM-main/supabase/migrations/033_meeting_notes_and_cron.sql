-- Migration to add meeting notes and pg_cron automated reminders

-- 1. Add columns to meetings table for tracking notes and reminders
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reminder_morning_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_evening_sent BOOLEAN DEFAULT false;

-- 2. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Schedule the Cron Job
-- Note: the cron job makes an HTTP POST request to your API route
-- You must update the URL below to match your production domain before deploying to prod.
-- For local testing, pg_net cannot hit 'localhost', so you must use a tool like ngrok
-- or hit the endpoint manually.

SELECT cron.schedule(
  'meeting_reminders',
  '0 * * * *', -- Run every hour at minute 0
  $$
    SELECT net.http_post(
        url:='https://your-production-domain.com/api/cron/meeting-reminders',
        headers:='{"Content-Type": "application/json"}',
        body:='{}'
    );
  $$
);
