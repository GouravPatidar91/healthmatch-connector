-- Drop the duplicate trigger that causes double status entries
DROP TRIGGER IF EXISTS track_order_status_changes ON public.medicine_orders;

-- Clean up existing duplicate entries in medicine_order_status_history
-- Keep only the first entry for each order_id + status + created_at combination
DELETE FROM medicine_order_status_history a
USING medicine_order_status_history b
WHERE a.id > b.id
  AND a.order_id = b.order_id
  AND a.status = b.status
  AND DATE_TRUNC('second', a.created_at) = DATE_TRUNC('second', b.created_at);