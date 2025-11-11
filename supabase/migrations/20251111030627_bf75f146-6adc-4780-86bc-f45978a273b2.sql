-- Create a function to check if a delivery request is expired
CREATE OR REPLACE FUNCTION public.is_delivery_request_expired(expires_at timestamptz)
RETURNS boolean AS $$
BEGIN
  RETURN expires_at <= NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- Add an index for better query performance on active delivery requests
CREATE INDEX IF NOT EXISTS idx_delivery_requests_active 
ON public.delivery_requests(delivery_partner_id, status, expires_at)
WHERE status = 'pending';

-- Add a comment to explain the index purpose
COMMENT ON INDEX idx_delivery_requests_active IS 'Optimizes queries for active pending delivery requests by partner';