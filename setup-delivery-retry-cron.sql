-- ============================================
-- Setup Cron Job for Automatic Delivery Partner Retry
-- ============================================
-- This cron job runs every minute to check for orders that need
-- delivery partner assignment with expanded search radius
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/bpflebtklgnivcanhlbp/sql/new
-- 2. Copy and paste this SQL
-- 3. Click "Run" to create the cron job
-- ============================================

SELECT cron.schedule(
  'retry-delivery-broadcast-every-minute',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://bpflebtklgnivcanhlbp.supabase.co/functions/v1/retry-delivery-broadcast',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZmxlYnRrbGduaXZjYW5obGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzODQxNTgsImV4cCI6MjA1ODk2MDE1OH0.CqYSMYAs6DZz7sT2z6B0ljqj3yMahuFcSTh0wYBnz_E"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'retry-delivery-broadcast-every-minute';
