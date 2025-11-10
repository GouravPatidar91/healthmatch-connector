-- Enable full row tracking for delivery_requests to support real-time updates
ALTER TABLE delivery_requests REPLICA IDENTITY FULL;

-- Add index for faster queries on delivery_partner_id and status
CREATE INDEX IF NOT EXISTS idx_delivery_requests_partner_status 
ON delivery_requests(delivery_partner_id, status);

-- Add index for faster queries on order_id
CREATE INDEX IF NOT EXISTS idx_delivery_requests_order 
ON delivery_requests(order_id);

-- Add index for expired requests cleanup
CREATE INDEX IF NOT EXISTS idx_delivery_requests_expires 
ON delivery_requests(expires_at) WHERE status = 'pending';