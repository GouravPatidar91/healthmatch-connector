-- Create function to auto-reject other pending requests when one is accepted
-- Uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_delivery_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a request is accepted, reject all other pending requests for the same order
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE delivery_requests
    SET 
      status = 'rejected',
      responded_at = NOW(),
      rejection_reason = 'Another partner accepted'
    WHERE order_id = NEW.order_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires when delivery_request status changes to accepted
DROP TRIGGER IF EXISTS on_delivery_request_accepted ON delivery_requests;
CREATE TRIGGER on_delivery_request_accepted
  AFTER UPDATE ON delivery_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_delivery_request_accepted();

-- One-time cleanup: Reject all pending requests for orders that are already assigned
UPDATE delivery_requests dr
SET 
  status = 'rejected',
  responded_at = NOW(),
  rejection_reason = 'Order already assigned (cleanup)'
WHERE dr.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM medicine_orders mo
    WHERE mo.id = dr.order_id
      AND mo.delivery_partner_id IS NOT NULL
  );