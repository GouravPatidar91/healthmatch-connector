-- Set replica identity to FULL to capture all column values in realtime updates
-- This ensures we get complete data in realtime events
ALTER TABLE public.delivery_requests REPLICA IDENTITY FULL;